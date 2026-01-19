import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './components/base-layout'

interface TicketClosedEmailProps {
  ticketTitle: string
  ticketId: string
  workspaceName: string
  reopenLink: string
}

export function TicketClosedEmail({
  ticketTitle,
  ticketId,
  workspaceName,
  reopenLink,
}: TicketClosedEmailProps) {
  return (
    <BaseLayout preview={`Ticket closed: ${ticketTitle}`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Ticket Closed
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        Your ticket at <strong>{workspaceName}</strong> has been automatically closed
        after 7 days in the Implementation stage.
      </Text>

      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Text className="text-brand-text font-semibold m-0 mb-2">
          {ticketTitle}
        </Text>
        <Text className="text-xs text-brand-muted m-0 mt-2">
          ID: {ticketId}
        </Text>
      </Section>

      <Text className="text-brand-text leading-6 mb-4">
        If you are not satisfied with the result or have unresolved issues,
        you can reopen this ticket within 7 days.
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={reopenLink}
          className="bg-brand-forest text-white px-6 py-3 rounded-lg font-semibold"
        >
          Reopen Ticket
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        This link is valid for 7 days. After that, the ticket cannot be reopened.
      </Text>

      <Text className="text-sm text-brand-muted mt-4">
        You received this email because you created this ticket at {workspaceName}.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default TicketClosedEmail
