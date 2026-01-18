import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './components/base-layout'

interface PasswordResetEmailProps {
  resetLink: string
  userEmail: string
}

export function PasswordResetEmail({
  resetLink,
  userEmail,
}: PasswordResetEmailProps) {
  return (
    <BaseLayout preview="Reset password untuk akun my21staff Anda">
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Reset Password
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        Kami menerima permintaan reset password untuk akun{' '}
        <strong>{userEmail}</strong>.
      </Text>

      <Text className="text-brand-text leading-6 mb-4">
        Klik tombol di bawah untuk membuat password baru:
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={resetLink}
          className="bg-brand-forest text-white px-6 py-3 rounded-lg font-semibold"
        >
          Reset Password
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password,
        abaikan email ini.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default PasswordResetEmail
