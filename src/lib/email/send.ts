import { getResend, FROM_EMAIL } from './resend'
import { InvitationEmail } from '@/emails/invitation'
import { PasswordResetEmail } from '@/emails/password-reset'

export async function sendInvitationEmail({
  to,
  inviteLink,
  workspaceName,
  inviterName,
}: {
  to: string
  inviteLink: string
  workspaceName: string
  inviterName: string
}) {
  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Anda diundang ke ${workspaceName}`,
    react: InvitationEmail({ inviteLink, workspaceName, inviterName }),
  })

  if (error) {
    console.error('Failed to send invitation email:', error)
    throw new Error(`Email failed: ${error.message}`)
  }

  return data
}

export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string
  resetLink: string
}) {
  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Password - my21staff',
    react: PasswordResetEmail({ resetLink, userEmail: to }),
  })

  if (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error(`Email failed: ${error.message}`)
  }

  return data
}
