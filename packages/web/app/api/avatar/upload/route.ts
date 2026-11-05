import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { promises as fs } from 'fs'
import path from 'path'
const MAX_FILE_SIZE = 5 * 1024 * 1024 
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
    const buffer = Buffer.from(await file.arrayBuffer())
    let publicUrl = ''
    try {
      const storagePath = `${user.id}/${fileName}`
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
      }
    } catch {
    }
    if (!publicUrl) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
      await fs.mkdir(uploadsDir, { recursive: true })
      const localFilePath = path.join(uploadsDir, fileName)
      await fs.writeFile(localFilePath, buffer)
      publicUrl = `/uploads/avatars/${fileName}`
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
