import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Bot, User } from 'lucide-react'

interface Note {
  content: string
  addedBy: string
  addedAt: number
}

export function LeadNotesTimeline({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No notes yet</p>
      </div>
    )
  }

  // Sort most recent first
  const sortedNotes = [...notes].sort((a, b) => b.addedAt - a.addedAt)

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Notes</h4>
      <div className="space-y-3">
        {sortedNotes.map((note, index) => {
          const isBot = note.addedBy.includes('bot') || note.addedBy.includes('sarah') || note.addedBy.includes('grok')
          return (
            <div key={index} className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isBot ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {isBot ? <Bot className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-gray-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{note.addedBy}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(note.addedAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{note.content}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
