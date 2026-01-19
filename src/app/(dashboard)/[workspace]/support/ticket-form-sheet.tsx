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
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be at most 255 characters'),
  description: z
    .string()
    .min(1, 'Description is required'),
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
  { value: 'bug', label: CATEGORY_CONFIG.bug.label },
  { value: 'feature', label: CATEGORY_CONFIG.feature.label },
  { value: 'question', label: CATEGORY_CONFIG.question.label },
]

const priorities: { value: TicketPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Not urgent' },
  { value: 'medium', label: 'Medium', description: 'Needs attention' },
  { value: 'high', label: 'High', description: 'Urgent' },
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
        toast.success('Ticket created successfully')
        form.reset()
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create ticket')
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
      toast.error('Failed to create ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6">
        <SheetHeader className="pb-4">
          <SheetTitle>Create New Ticket</SheetTitle>
          <SheetDescription>
            Report an issue or submit a new request
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief summary of your issue or request"
                      className="mt-2"
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
                  <FormLabel className="text-sm font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your issue or request in detail..."
                      rows={4}
                      className="mt-2 resize-none"
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
                  <FormLabel className="text-sm font-medium">Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select category" />
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
                  <FormLabel className="text-sm font-medium">Priority</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="mt-3 grid grid-cols-3 gap-2"
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
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-background px-2 py-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                          >
                            <span className="text-sm font-semibold">{p.label}</span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">
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
            <div className="flex gap-3 pt-4 mt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
