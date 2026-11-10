import { redirect } from 'next/navigation'

export default function ResetPasswordRedirect() {
  redirect('/account/change-password')
}

