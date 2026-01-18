import { getResend, FROM_EMAIL } from './resend'
import { InvitationEmail } from '@/emails/invitation'

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
