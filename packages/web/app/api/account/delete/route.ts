import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function getAccountDeletedEmailHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Security Alert: Your Klyro account was deleted</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; padding: 0; background-color: #F5F6FA; color: #14161C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    table { border-collapse: separate; }
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color: #000000 !important; }
      .email-card { background-color: #1A1A1A !important; border-color: #2E3148 !important; }
      .text-heading { color: #E8EAF0 !important; }
      .text-body { color: #8B8FA8 !important; }
      .alert-box { background-color: #1E1214 !important; border-color: #4A2328 !important; }
      .alert-text { color: #FCA5A5 !important; }
      .footer-text { color: #6C757D !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; background-color: #F5F6FA; color: #14161C;">
  <table role="presentation" class="email-bg" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F5F6FA; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px 50px 16px;">
        <table role="presentation" width="540" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; width: 100%; text-align: left;">
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="https://klyro.live/klyro-logo-new.png" alt="Klyro" width="34" height="34" style="display: block; width: 34px; height: 34px; border: 0;" />
                  </td>
                  <td style="padding-left: 10px; vertical-align: middle;">
                    <span class="text-heading" style="font-size: 22px; font-weight: 800; color: #14161C; letter-spacing: -0.4px;">Klyro</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-card" style="background-color: #FFFFFF; border: 1px solid #D9DCE6; border-radius: 12px; overflow: hidden; padding: 34px;">
              <h1 class="text-heading" style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #14161C; line-height: 1.35;">
                Your Klyro account has been deleted
              </h1>
              <p class="text-body" style="font-size: 15px; line-height: 1.6; color: #5A5F73; margin: 0 0 20px 0;">
                This email confirms that your Klyro user account and all associated logic circuit projects, profiles, and active sessions have been permanently deleted as requested.
              </p>
              <div class="alert-box" style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px 18px; margin-bottom: 16px;">
                <p class="alert-text" style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #DC2626;">
                  Did you not request this deletion?
                </p>
                <p class="text-body" style="margin: 0; font-size: 13px; line-height: 1.5; color: #5A5F73;">
                  If this deletion was unauthorized or performed by mistake, please contact our support immediately.
                </p>
              </div>
              <p class="footer-text" style="margin: 0; font-size: 13px; line-height: 1.5; color: #8A94A6;">
                Thank you for using Klyro. You are always welcome to create a new account in the future.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 24px; text-align: center;">
              <p class="footer-text" style="margin: 0; font-size: 12px; line-height: 1.5; color: #8A94A6;">
                © Klyro • The open-source lab bench for digital logic
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be signed in to perform this action.' },
        { status: 401 }
      )
    }

    const userId = user.id
    const userEmail = user.email

    // 1. Dispatch confirmation email notification before account destruction
    if (userEmail && process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Klyro <onboarding@resend.dev>',
            to: [userEmail],
            subject: 'Security Alert: Your Klyro account was deleted',
            html: getAccountDeletedEmailHtml(),
          }),
        })
      } catch (emailErr) {
        console.warn('Could not send account deletion confirmation email:', emailErr)
      }
    }

    // 2. Delete user circuits from database
    const { error: circuitsError } = await supabase
      .from('circuits')
      .delete()
      .eq('user_id', userId)

    if (circuitsError) {
      console.error('Error deleting user circuits:', circuitsError)
    }

    // 3. Delete user profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
    }

    // 4. Delete user avatar file from storage if present
    const avatarUrl = user.user_metadata?.avatar_url
    if (avatarUrl && typeof avatarUrl === 'string') {
      try {
        const urlParts = avatarUrl.split('/avatars/')
        const filePath = urlParts[1]
        if (filePath) {
          await supabase.storage.from('avatars').remove([filePath])
        }
      } catch (err) {
        console.warn('Could not remove avatar from storage:', err)
      }
    }

    // 5. Delete user account from Supabase Auth
    let authDeleted = false
    let authErrorMessage = ''

    // Method A: Admin Client using SUPABASE_SERVICE_ROLE_KEY
    const admin = createAdminClient()
    if (admin) {
      const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId)
      if (!deleteAuthError) {
        authDeleted = true
      } else {
        console.error('Error deleting user via admin auth:', deleteAuthError)
        authErrorMessage = deleteAuthError.message
      }
    }

    // Method B: Fallback to Postgres RPC if admin key is not available
    if (!authDeleted) {
      try {
        const { error: rpcError } = await supabase.rpc('delete_user')
        if (!rpcError) {
          authDeleted = true
        } else {
          console.warn('RPC delete_user fallback failed or not defined:', rpcError)
          authErrorMessage = rpcError.message || rpcError.details || 'RPC delete_user call failed'
        }
      } catch (rpcErr: unknown) {
        console.warn('RPC delete_user call exception:', rpcErr)
        if (rpcErr instanceof Error) {
          authErrorMessage = rpcErr.message
        }
      }
    }

    if (!authDeleted) {
      return NextResponse.json(
        {
          error:
            authErrorMessage ||
            'Could not delete user from auth database. Please ensure SUPABASE_SERVICE_ROLE_KEY is set in your .env.local, or create the delete_user() Postgres RPC in your Supabase dashboard.',
        },
        { status: 500 }
      )
    }

    // 6. Sign out the user session
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted.',
    })
  } catch (err) {
    console.error('Unexpected error deleting account:', err)
    return NextResponse.json(
      { error: 'Internal server error while deleting account.' },
      { status: 500 }
    )
  }
}
