/**
 * WhatsApp-style typing indicator
 * Shows three animated dots in a message bubble when AI is processing response
 */

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-muted rounded-2xl px-4 py-2.5 max-w-[75%] shadow-sm">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '0s', animationDuration: '1s' }}
          />
          <div
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '0.2s', animationDuration: '1s' }}
          />
          <div
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '0.4s', animationDuration: '1s' }}
          />
        </div>
      </div>
    </div>
  )
}
