import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './components/base-layout'

interface InvitationEmailProps {
  inviteLink: string
  workspaceName: string
  inviterName: string
}

export function InvitationEmail({
  inviteLink,
  workspaceName,
  inviterName,
}: InvitationEmailProps) {
  return (
    <BaseLayout preview={`${inviterName} mengundang Anda ke ${workspaceName}`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Undangan Bergabung
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        <strong>{inviterName}</strong> mengundang Anda untuk bergabung ke{' '}
        <strong>{workspaceName}</strong> di my21staff.
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={inviteLink}
          className="bg-brand-forest text-white px-6 py-3 rounded-lg font-semibold"
        >
          Terima Undangan
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        Link ini berlaku selama 7 hari. Jika Anda tidak mengenal pengirim,
        abaikan email ini.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default InvitationEmail
