import { Heading, Text, Section } from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './components/base-layout'

interface RoleChangeEmailProps {
  userName: string
  workspaceName: string
  oldRole: string
  newRole: string
}

export function RoleChangeEmail({
  userName,
  workspaceName,
  oldRole,
  newRole,
}: RoleChangeEmailProps) {
  return (
    <BaseLayout preview={`Role Anda di ${workspaceName} telah diubah`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Perubahan Role
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        Halo <strong>{userName}</strong>,
      </Text>

      <Text className="text-brand-text leading-6 mb-4">
        Role Anda di <strong>{workspaceName}</strong> telah diubah dari{' '}
        <strong>{oldRole}</strong> menjadi <strong>{newRole}</strong>.
      </Text>

      <Section className="my-6 p-4 bg-gray-50 rounded-lg">
        <Text className="text-sm text-brand-text m-0 mb-2">
          <strong>Workspace:</strong> {workspaceName}
        </Text>
        <Text className="text-sm text-brand-text m-0 mb-2">
          <strong>Role sebelumnya:</strong> {oldRole}
        </Text>
        <Text className="text-sm text-brand-text m-0">
          <strong>Role baru:</strong> {newRole}
        </Text>
      </Section>

      <Text className="text-sm text-brand-muted">
        Jika Anda merasa ini adalah kesalahan, silakan hubungi pemilik workspace
        Anda.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default RoleChangeEmail
