import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender for all emails - "Kia dari my21staff" matches bot persona
export const FROM_EMAIL = 'Kia dari my21staff <kia@my21staff.com>'
