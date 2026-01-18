import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './components/base-layout'

interface TicketCreatedEmailProps {
  ticketTitle: string
  ticketId: string
  workspaceName: string
  requesterName: string
  category: string
  priority: string
  ticketLink: string
}

export function TicketCreatedEmail({
  ticketTitle,
  ticketId,
  workspaceName,
  requesterName,
  category,
  priority,
  ticketLink,
}: TicketCreatedEmailProps) {
  return (
    <BaseLayout preview={`Tiket baru: ${ticketTitle}`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Tiket Baru Dibuat
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        <strong>{requesterName}</strong> membuat tiket baru di{' '}
        <strong>{workspaceName}</strong>.
      </Text>

      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Text className="text-brand-text font-semibold m-0 mb-2">
          {ticketTitle}
        </Text>
        <Text className="text-sm text-brand-muted m-0">
          Kategori: {category} | Prioritas: {priority}
        </Text>
        <Text className="text-xs text-brand-muted m-0 mt-2">
          ID: {ticketId}
        </Text>
      </Section>

      <Section className="my-8 text-center">
        <Button
          href={ticketLink}
          className="bg-brand-forest text-white px-6 py-3 rounded-lg font-semibold"
        >
          Lihat Tiket
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        Anda menerima email ini karena terlibat dalam tiket di {workspaceName}.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default TicketCreatedEmail
