import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { promises as fs } from 'fs'
import path from 'path'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to update your avatar.' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Unsupported image format. Allowed formats: PNG, JPG, WEBP, GIF, SVG.',
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image file size exceeds the 5MB limit.' },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const storagePath = `${user.id}/${fileName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    let publicUrl = ''

    // 1. Try with Supabase Admin Client (Service Role) if configured
    const adminClient = createAdminClient()
    if (adminClient) {
      try {
        const { data: buckets } = await adminClient.storage.listBuckets()
        const bucketExists = buckets?.some((b) => b.name === 'avatars')
        if (!bucketExists) {
          await adminClient.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: MAX_FILE_SIZE,
            allowedMimeTypes: ALLOWED_MIME_TYPES,
          })
        }

        const { error: uploadError } = await adminClient.storage
          .from('avatars')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          })

        if (!uploadError) {
          const { data: urlData } = adminClient.storage
            .from('avatars')
            .getPublicUrl(storagePath)
          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl
          }
        }
      } catch (adminErr) {
        console.error('Supabase admin storage upload error:', adminErr)
      }
    }

    // 2. Fall back to authenticated client storage upload
    if (!publicUrl) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        })

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(storagePath)
        if (urlData?.publicUrl) {
          publicUrl = urlData.publicUrl
        }
      } else if (uploadError) {
        // 3. Fallback to local filesystem ONLY in local development
        const isLocalDev =
          process.env.NODE_ENV === 'development' && !process.env.VERCEL
        if (isLocalDev) {
          try {
            const uploadsDir = path.join(
              process.cwd(),
              'public',
              'uploads',
              'avatars'
            )
            await fs.mkdir(uploadsDir, { recursive: true })
            const localFilePath = path.join(uploadsDir, fileName)
            await fs.writeFile(localFilePath, buffer)
            publicUrl = `/uploads/avatars/${fileName}`
          } catch (fsErr) {
            console.error('Local disk fallback error:', fsErr)
          }
        }

        // If still no publicUrl, provide a clear, actionable error
        if (!publicUrl) {
          const errMsg = uploadError.message?.toLowerCase() || ''
          const errCode = (uploadError as { statusCode?: string | number })
            ?.statusCode

          if (errMsg.includes('bucket not found') || errCode === '404' || errCode === 404) {
            return NextResponse.json(
              {
                error:
                  "Supabase Storage bucket 'avatars' not found. Please create a public bucket named 'avatars' in your Supabase dashboard (Storage > New bucket), or set SUPABASE_SERVICE_ROLE_KEY in your deployment environment variables.",
              },
              { status: 500 }
            )
          }

          if (
            errMsg.includes('row-level security') ||
            errMsg.includes('policy') ||
            errCode === '403' ||
            errCode === 403
          ) {
            return NextResponse.json(
              {
                error:
                  "Storage permission denied. Please add an INSERT policy for authenticated users on the 'avatars' bucket in Supabase, or set SUPABASE_SERVICE_ROLE_KEY in your deployment environment.",
              },
              { status: 500 }
            )
          }

          return NextResponse.json(
            {
              error: `Storage upload failed: ${uploadError.message}`,
            },
            { status: 500 }
          )
        }
      }
    }

    if (!publicUrl) {
      return NextResponse.json(
        {
          error:
            "Unable to upload avatar. Please create a public 'avatars' bucket in your Supabase project, or use the 'Image Link' tab to provide an image URL.",
        },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      publicUrl,
      message: 'Avatar updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while uploading avatar.',
      },
      { status: 500 }
    )
  }
}
