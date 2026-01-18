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
    <BaseLayout preview={`Tiket selesai: ${ticketTitle}`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Tiket Telah Selesai
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        Tiket Anda di <strong>{workspaceName}</strong> telah ditutup otomatis
        setelah 7 hari di tahap Implementasi.
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
        Jika Anda belum puas dengan hasilnya atau ada masalah yang belum
        terselesaikan, Anda dapat membuka kembali tiket ini dalam waktu 7 hari.
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={reopenLink}
          className="bg-brand-forest text-white px-6 py-3 rounded-lg font-semibold"
        >
          Buka Kembali Tiket
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        Link ini berlaku selama 7 hari. Setelah itu, tiket tidak dapat dibuka kembali.
      </Text>

      <Text className="text-sm text-brand-muted mt-4">
        Anda menerima email ini karena Anda adalah pembuat tiket ini di {workspaceName}.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default TicketClosedEmail
