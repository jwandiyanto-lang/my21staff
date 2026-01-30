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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, Plus, Trash2, MessageSquare } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface ButtonOption {
  type: 'reply' | 'url'
  title: string
  url?: string
  payload?: string
}

interface InteractiveMessage {
  type: 'button' | 'list'
  header?: string
  body: string
  footer?: string
  buttons: ButtonOption[]
}

interface InteractiveDialogProps {
  workspaceId: Id<'workspaces'>
  onSend: (message: InteractiveMessage) => void
}

export function InteractiveDialog({ workspaceId, onSend }: InteractiveDialogProps) {
  const [open, setOpen] = useState(false)
  const [messageType, setMessageType] = useState<'button' | 'list'>('button')
  const [header, setHeader] = useState('')
  const [body, setBody] = useState('')
  const [footer, setFooter] = useState('')
  const [buttons, setButtons] = useState<ButtonOption[]>([
    { type: 'reply', title: '', payload: '' },
  ])

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { type: 'reply', title: '', payload: '' }])
    }
  }

  const removeButton = (index: number) => {
    if (buttons.length > 1) {
      setButtons(buttons.filter((_, i) => i !== index))
    }
  }

  const updateButton = (index: number, field: keyof ButtonOption, value: string) => {
    const newButtons = [...buttons]
    newButtons[index] = { ...newButtons[index], [field]: value }
    setButtons(newButtons)
  }

  const handleSend = () => {
    const message: InteractiveMessage = {
      type: messageType,
      header: header || undefined,
      body,
      footer: footer || undefined,
      buttons,
    }
    onSend(message)
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setHeader('')
    setBody('')
    setFooter('')
    setButtons([{ type: 'reply', title: '', payload: '' }])
  }

  const isFormValid = body.trim() !== '' && buttons.every(b => b.title.trim() !== '')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Interactive
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Interactive Message</DialogTitle>
          <DialogDescription>
            Create an interactive message with buttons for quick responses
          </DialogDescription>
        </DialogHeader>

        <Tabs value={messageType} onValueChange={(v) => setMessageType(v as 'button' | 'list')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="button">Button Message</TabsTrigger>
            <TabsTrigger value="list">List Message</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-1">
            <div className="space-y-4 py-4">
              {/* Header */}
              <div>
                <Label htmlFor="header">Header (optional)</Label>
                <Input
                  id="header"
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  placeholder="Bold header text"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">{header.length}/60 characters</p>
              </div>

              {/* Body */}
              <div>
                <Label htmlFor="body">Body *</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Main message text"
                  rows={3}
                  maxLength={1024}
                />
                <p className="text-xs text-muted-foreground mt-1">{body.length}/1024 characters</p>
              </div>

              {/* Footer */}
              <div>
                <Label htmlFor="footer">Footer (optional)</Label>
                <Input
                  id="footer"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="Small disclaimer text"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">{footer.length}/60 characters</p>
              </div>

              {/* Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Buttons</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addButton}
                    disabled={buttons.length >= 3}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Button
                  </Button>
                </div>
                <div className="space-y-3">
                  {buttons.map((button, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Button {index + 1}</span>
                        {buttons.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeButton(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={button.title}
                        onChange={(e) => updateButton(index, 'title', e.target.value)}
                        placeholder="Button title"
                        maxLength={20}
                      />
                      <p className="text-xs text-muted-foreground">{button.title.length}/20 characters</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum 3 buttons per message
                </p>
              </div>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Preview */}
        <div className="border-t pt-4">
          <Label className="mb-2 block">Preview</Label>
          <div className="bg-muted rounded-lg p-3 max-w-sm mx-auto">
            {header && (
              <div className="font-semibold text-sm mb-2">{header}</div>
            )}
            <div className="text-sm whitespace-pre-wrap mb-2">{body || 'Body text'}</div>
            {footer && (
              <div className="text-xs text-muted-foreground mb-2">{footer}</div>
            )}
            <div className="space-y-1">
              {buttons.filter(b => b.title).map((button, i) => (
                <div
                  key={i}
                  className="bg-background rounded px-3 py-2 text-sm text-center font-medium"
                >
                  {button.title || `Button ${i + 1}`}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!isFormValid}>
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
