'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SendHorizonal, Loader2, Paperclip, X, Image, FileText, Film, Zap } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import type { Message } from '@/types/database'

interface MessageInputProps {
  conversationId: string
  contactPhone: string
  workspaceId: string
  onMessageSent: (message: Message, isOptimistic: boolean) => void
  onMessageError: (optimisticId: string) => void
}

type MediaType = 'image' | 'video' | 'document'

function getMediaType(file: File): MediaType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

function getMediaIcon(type: MediaType) {
  switch (type) {
    case 'image': return Image
    case 'video': return Film
    default: return FileText
  }
}

// Quick reply templates
const QUICK_TEMPLATES = [
  { label: 'Greeting', text: 'Halo! Terima kasih sudah menghubungi kami. Ada yang bisa kami bantu?' },
  { label: 'Follow Up', text: 'Halo, kami ingin follow up mengenai percakapan kita sebelumnya. Apakah ada pertanyaan yang bisa kami bantu?' },
  { label: 'Thank You', text: 'Terima kasih banyak! Jika ada pertanyaan lain, jangan ragu untuk menghubungi kami kembali.' },
  { label: 'Busy', text: 'Terima kasih sudah menghubungi. Saat ini kami sedang sibuk, akan kami balas secepatnya.' },
  { label: 'Schedule', text: 'Apakah Anda bersedia untuk jadwalkan panggilan? Mohon informasikan waktu yang tersedia.' },
]

export function MessageInput({
  conversationId,
  contactPhone,
  workspaceId,
  onMessageSent,
  onMessageError,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTemplateSelect = (text: string) => {
    setContent(text)
    setTemplateOpen(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 16MB for WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('File size must be less than 16MB')
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedContent = content.trim()
    if ((!trimmedContent && !selectedFile) || isSending) return

    // Determine message type
    const messageType = selectedFile ? getMediaType(selectedFile) : 'text'

    // Create optimistic message
    const optimisticId = crypto.randomUUID()
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      workspace_id: workspaceId,
      direction: 'outbound',
      sender_type: 'user',
      sender_id: null,
      content: trimmedContent || (selectedFile ? `[${messageType}]` : ''),
      message_type: messageType,
      media_url: filePreview,
      kapso_message_id: null,
      metadata: { status: 'sending', filename: selectedFile?.name },
      created_at: new Date().toISOString(),
    }

    // Clear input immediately and show optimistic message
    setContent('')
    const fileToSend = selectedFile
    clearFile()
    onMessageSent(optimisticMessage, true)
    setIsSending(true)

    try {
      let response

      if (fileToSend) {
        // Upload file first, then send media message
        const formData = new FormData()
        formData.append('file', fileToSend)
        formData.append('conversationId', conversationId)
        formData.append('caption', trimmedContent)

        response = await fetch('/api/messages/send-media', {
          method: 'POST',
          body: formData,
        })
      } else {
        // Send text message
        response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, content: trimmedContent }),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const { message } = await response.json()

      // Replace optimistic message with real one
      onMessageSent({ ...message, _optimisticId: optimisticId } as Message & { _optimisticId: string }, false)
    } catch (error) {
      console.error('Send error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
      // Remove optimistic message on error
      onMessageError(optimisticId)
    } finally {
      setIsSending(false)
    }
  }

  const MediaIcon = selectedFile ? getMediaIcon(getMediaType(selectedFile)) : null

  return (
    <div className="border-t bg-background">
      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
            ) : (
              <div className="h-12 w-12 bg-muted-foreground/10 rounded flex items-center justify-center">
                {MediaIcon && <MediaIcon className="h-6 w-6 text-muted-foreground" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        {/* File Input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Quick Templates */}
        <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSending}
              title="Quick replies"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Quick Replies</p>
              {QUICK_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  onClick={() => handleTemplateSelect(template.text)}
                  className="w-full text-left px-2 py-2 rounded-md hover:bg-muted text-sm transition-colors"
                >
                  <span className="font-medium">{template.label}</span>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{template.text}</p>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Attach Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Input
          placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSending}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSending || (!content.trim() && !selectedFile)}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
