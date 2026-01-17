import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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
  await transporter.sendMail({
    from: `"my21staff" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Anda diundang ke ${workspaceName}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Undangan Bergabung</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          <strong>${inviterName}</strong> mengundang Anda untuk bergabung ke <strong>${workspaceName}</strong> di my21staff.
        </p>
        <p style="margin: 24px 0;">
          <a href="${inviteLink}"
             style="display: inline-block; background: #F7931A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Terima Undangan
          </a>
        </p>
        <p style="color: #888; font-size: 14px;">
          Link ini berlaku selama 7 hari.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">
          my21staff - WhatsApp CRM untuk bisnis Indonesia
        </p>
      </div>
    `,
  })
}
