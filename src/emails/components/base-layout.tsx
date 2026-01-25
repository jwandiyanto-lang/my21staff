import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Hr,
  Tailwind,
  Preview,
} from '@react-email/components'
import * as React from 'react'

const brandConfig = {
  theme: {
    extend: {
      colors: {
        'brand-forest': '#284b31',
        'brand-text': '#2D2A26',
        'brand-muted': '#8C7E74',
        'brand-orange': '#F7931A',
      },
    },
  },
}

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind config={brandConfig}>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[600px] px-4 py-8">
            {/* Logo */}
            <Section className="mb-8">
              <Img
                src="https://my21staff.com/logo.png"
                alt="my21staff"
                width={120}
              />
            </Section>

            {/* Content */}
            {children}

            {/* Footer */}
            <Hr className="my-6 border-gray-200" />
            <Section className="text-center">
              <Text className="text-xs text-brand-muted m-0">
                my21staff - WhatsApp CRM for your business
              </Text>
              <Text className="text-xs text-brand-muted m-0">
                &copy; {new Date().getFullYear()} my21staff
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
