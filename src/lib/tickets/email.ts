import { getResend, FROM_EMAIL } from '@/lib/email/resend'
import { render } from '@react-email/render'
import { TicketCreatedEmail } from '@/emails/ticket-created'
import { TicketUpdatedEmail } from '@/emails/ticket-updated'
import { TicketClosedEmail } from '@/emails/ticket-closed'

interface Participant {
  email: string
  name: string
}

export async function sendTicketCreatedEmail(
  recipients: Participant[],
  props: Parameters<typeof TicketCreatedEmail>[0]
) {
  const resend = getResend()
  const html = await render(TicketCreatedEmail(props))

  for (const recipient of recipients) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: recipient.email,
        subject: `Tiket Baru: ${props.ticketTitle}`,
        html
      })
    } catch (error) {
      console.error(`Failed to send ticket created email to ${recipient.email}:`, error)
    }
  }
}

export async function sendTicketUpdatedEmail(
  recipients: Participant[],
  props: Parameters<typeof TicketUpdatedEmail>[0]
) {
  const resend = getResend()
  const html = await render(TicketUpdatedEmail(props))

  for (const recipient of recipients) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: recipient.email,
        subject: `Tiket Diperbarui: ${props.ticketTitle}`,
        html
      })
    } catch (error) {
      console.error(`Failed to send ticket updated email to ${recipient.email}:`, error)
    }
  }
}

export async function sendTicketClosedEmail(
  recipient: Participant,
  props: Parameters<typeof TicketClosedEmail>[0]
) {
  const resend = getResend()
  const html = await render(TicketClosedEmail(props))

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient.email,
      subject: `Tiket Selesai: ${props.ticketTitle}`,
      html
    })
  } catch (error) {
    console.error(`Failed to send ticket closed email to ${recipient.email}:`, error)
  }
}
