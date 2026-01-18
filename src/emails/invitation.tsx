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
    <BaseLayout preview={`${inviterName} invited you to ${workspaceName}`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Team Invitation
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        <strong>{inviterName}</strong> has invited you to join{' '}
        <strong>{workspaceName}</strong> on my21staff.
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={inviteLink}
          style={{
            backgroundColor: '#2D4B3E',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Accept Invitation
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        This link expires in 7 days. If you don&apos;t recognize the sender,
        you can safely ignore this email.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default InvitationEmail
