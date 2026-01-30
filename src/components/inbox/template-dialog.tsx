'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Send } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface Template {
  id: string
  name: string
  category: string
  language: string
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER'
    text: string
  }>
}

interface TemplateDialogProps {
  workspaceId: Id<'workspaces'>
  onSend: (template: Template, variables?: Record<string, string>) => void
}

export function TemplateDialog({ workspaceId, onSend }: TemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Mock templates for demo
  const templates: Template[] = [
    {
      id: 'welcome',
      name: 'Welcome Message',
      category: 'marketing',
      language: 'id',
      components: [
        { type: 'HEADER', text: 'Welcome to our service!' },
        { type: 'BODY', text: 'Hi {{1}}, thank you for reaching out. We will get back to you shortly.' },
        { type: 'FOOTER', text: 'Reply STOP to opt out' },
      ],
    },
    {
      id: 'followup',
      name: 'Follow Up',
      category: 'utility',
      language: 'id',
      components: [
        { type: 'HEADER', text: 'Following up on your inquiry' },
        { type: 'BODY', text: 'Hi {{1}}, just checking if you need any more information about {{2}}.' },
      ],
    },
    {
      id: 'appointment',
      name: 'Appointment Reminder',
      category: 'utility',
      language: 'id',
      components: [
        { type: 'HEADER', text: 'Appointment Reminder' },
        { type: 'BODY', text: 'Hi {{1}}, this is a reminder about your appointment on {{2}} at {{3}}.' },
        { type: 'FOOTER', text: 'Reply RESCHEDULE to change' },
      ],
    },
  ]

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSend = () => {
    if (selectedTemplate) {
      onSend(selectedTemplate, variables)
      setOpen(false)
      setSelectedTemplate(null)
      setVariables({})
    }
  }

  const extractVariables = (template: Template): string[] => {
    const bodyText = template.components.find(c => c.type === 'BODY')?.text || ''
    const matches = bodyText.match(/\{\{\d+\}\}/g) || []
    return matches
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Template Message</DialogTitle>
          <DialogDescription>
            Choose a WhatsApp template to send to this conversation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Template list */}
          <div className="w-1/2 flex flex-col min-h-0">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
            />
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full p-3 text-left rounded-lg transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs opacity-70 capitalize">{template.category}</div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Template preview and variables */}
          <div className="w-1/2 flex flex-col min-h-0">
            {selectedTemplate ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-4">
                  <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    {selectedTemplate.components.map((comp, i) => (
                      <div key={i} className={`text-sm ${comp.type === 'HEADER' ? 'font-semibold' : comp.type === 'FOOTER' ? 'text-xs text-muted-foreground' : ''}`}>
                        {comp.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variable inputs */}
                {extractVariables(selectedTemplate).length > 0 && (
                  <div className="flex-1 overflow-y-auto">
                    <Label className="mb-2 block">Variables</Label>
                    <div className="space-y-3">
                      {extractVariables(selectedTemplate).map((varPlaceholder, i) => (
                        <div key={i}>
                          <Label htmlFor={`var-${i}`} className="text-sm text-muted-foreground">
                            {varPlaceholder}
                          </Label>
                          <Input
                            id={`var-${i}`}
                            value={variables[varPlaceholder] || ''}
                            onChange={(e) =>
                              setVariables({ ...variables, [varPlaceholder]: e.target.value })
                            }
                            placeholder={`Enter value for ${varPlaceholder}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm text-center">Select a template to preview</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!selectedTemplate}>
            <Send className="h-4 w-4 mr-2" />
            Send Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
