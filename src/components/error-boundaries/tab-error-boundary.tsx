'use client'

import { ErrorBoundary } from 'react-error-boundary'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TabErrorBoundaryProps {
  children: React.ReactNode
  tabName: string
}

function TabErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">Failed to Load Tab</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {error.message || 'An unexpected error occurred'}
      </p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try Again
      </Button>
    </div>
  )
}

export function TabErrorBoundary({ children, tabName }: TabErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={TabErrorFallback}
      onError={(error, info) => {
        console.error(`[${tabName} Tab Error]`, error)
        console.error('Component stack:', info.componentStack)
      }}
      onReset={() => {
        console.log(`Resetting ${tabName} tab`)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
