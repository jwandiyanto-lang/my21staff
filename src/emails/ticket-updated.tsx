import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './components/base-layout'

interface TicketUpdatedEmailProps {
  ticketTitle: string
  ticketId: string
  workspaceName: string
  changedByName: string
  fromStage: string
  toStage: string
  comment?: string
  ticketLink: string
}

export function TicketUpdatedEmail({
  ticketTitle,
  ticketId,
  workspaceName,
  changedByName,
  fromStage,
  toStage,
  comment,
  ticketLink,
}: TicketUpdatedEmailProps) {
  return (
    <BaseLayout preview={`Ticket updated: ${ticketTitle}`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Ticket Updated
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        <strong>{changedByName}</strong> moved the ticket to{' '}
        <strong>{toStage}</strong> stage.
      </Text>

      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Text className="text-brand-text font-semibold m-0 mb-2">
          {ticketTitle}
        </Text>
        <Text className="text-sm text-brand-muted m-0">
          {fromStage} &rarr; {toStage}
        </Text>
        <Text className="text-xs text-brand-muted m-0 mt-2">
          ID: {ticketId}
        </Text>
      </Section>

      {comment && (
        <Section className="bg-gray-100 rounded-lg p-4 mb-6 border-l-4 border-brand-forest">
          <Text className="text-sm text-brand-muted m-0 mb-1">Note:</Text>
          <Text className="text-brand-text m-0">{comment}</Text>
        </Section>
      )}

      <Section className="my-8 text-center">
        <Button
          href={ticketLink}
          className="bg-brand-forest text-white px-6 py-3 rounded-lg font-semibold"
        >
          View Ticket
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        You received this email because you are involved in a ticket at {workspaceName}.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default TicketUpdatedEmail
