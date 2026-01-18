'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  type TicketCategory,
  type TicketPriority,
  CATEGORY_CONFIG,
  PRIORITY_CONFIG
} from '@/lib/tickets'

const ticketSchema = z.object({
  title: z
    .string()
    .min(3, 'Judul minimal 3 karakter')
    .max(255, 'Judul maksimal 255 karakter'),
  description: z
    .string()
    .min(1, 'Deskripsi wajib diisi'),
  category: z.enum(['bug', 'feature', 'question'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
})

type TicketFormData = z.infer<typeof ticketSchema>

interface TicketFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess: () => void
}

const categories: { value: TicketCategory; label: string }[] = [
  { value: 'bug', label: CATEGORY_CONFIG.bug.labelId },
  { value: 'feature', label: CATEGORY_CONFIG.feature.labelId },
  { value: 'question', label: CATEGORY_CONFIG.question.labelId },
]

const priorities: { value: TicketPriority; label: string; description: string }[] = [
  { value: 'low', label: PRIORITY_CONFIG.low.labelId, description: 'Tidak mendesak' },
  { value: 'medium', label: PRIORITY_CONFIG.medium.labelId, description: 'Perlu ditangani' },
  { value: 'high', label: PRIORITY_CONFIG.high.labelId, description: 'Mendesak' },
]

export function TicketFormSheet({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: TicketFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'question',
      priority: 'medium',
    },
  })

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          ...data,
        }),
      })

      if (response.ok) {
        toast.success('Tiket berhasil dibuat')
        form.reset()
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal membuat tiket')
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
      toast.error('Gagal membuat tiket')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Buat Tiket Baru</SheetTitle>
          <SheetDescription>
            Laporkan masalah atau ajukan permintaan baru
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ringkasan masalah atau permintaan"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan masalah atau permintaan Anda secara detail..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioritas</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-3"
                    >
                      {priorities.map((p) => (
                        <div key={p.value}>
                          <RadioGroupItem
                            value={p.value}
                            id={`priority-${p.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`priority-${p.value}`}
                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <span className="font-medium">{p.label}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {p.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting ? 'Membuat...' : 'Buat Tiket'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
