/**
 * System message component for inline notifications in conversation thread
 * Used for mode transitions, status changes, etc.
 */

interface SystemMessageProps {
  text: string
}

export function SystemMessage({ text }: SystemMessageProps) {
  return (
    <div className="flex justify-center my-4">
      <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
        {text}
      </div>
    </div>
  )
}
