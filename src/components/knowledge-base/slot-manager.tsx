'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Loader2, Clock, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { ConsultantSlot } from '@/lib/ari/types'

interface TeamMember {
  id: string
  email: string
  full_name: string
}

interface SlotManagerProps {
  workspaceId: string
  teamMembers: TeamMember[]
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
]

export function SlotManager({ workspaceId, teamMembers }: SlotManagerProps) {
  const [slots, setSlots] = useState<ConsultantSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // New slot form state
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1, // Monday default
    start_time: '09:00',
    end_time: '10:00',
    duration_minutes: 60,
    booking_window_days: 14,
  })

  // Fetch slots on mount
  useEffect(() => {
    fetchSlots()
  }, [workspaceId])

  async function fetchSlots() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/slots`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSlots(data.slots || [])
    } catch (error) {
      console.error('Failed to fetch slots:', error)
      toast.error('Failed to load slots')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddSlot() {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlot),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }

      const data = await res.json()
      setSlots([...slots, data.slot])
      setIsAddDialogOpen(false)
      setNewSlot({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:00',
        duration_minutes: 60,
        booking_window_days: 14,
      })
      toast.success('Slot added successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add slot')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive(slot: ConsultantSlot) {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/slots/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !slot.is_active }),
      })

      if (!res.ok) throw new Error('Failed to update')

      setSlots(slots.map(s =>
        s.id === slot.id ? { ...s, is_active: !s.is_active } : s
      ))
      toast.success(slot.is_active ? 'Slot disabled' : 'Slot enabled')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm('Delete this slot?')) return

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/slots/${slotId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      setSlots(slots.filter(s => s.id !== slotId))
      toast.success('Slot deleted')
    } catch (error) {
      toast.error('Failed to delete slot')
    }
  }

  function formatTime(time: string) {
    // Convert HH:MM:SS or HH:MM to HH:MM
    return time.slice(0, 5)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Consultation Schedule</h2>
          <p className="text-sm text-muted-foreground">
            Set available times for consultation bookings
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Consultation Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Day of Week */}
              <div className="space-y-2">
                <Label>Day</Label>
                <Select
                  value={String(newSlot.day_of_week)}
                  onValueChange={(v) => setNewSlot({ ...newSlot, day_of_week: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration per Session</Label>
                <Select
                  value={String(newSlot.duration_minutes)}
                  onValueChange={(v) => setNewSlot({ ...newSlot, duration_minutes: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Booking Window */}
              <div className="space-y-2">
                <Label>Booking Window (days ahead)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={newSlot.booking_window_days}
                  onChange={(e) => setNewSlot({ ...newSlot, booking_window_days: parseInt(e.target.value) || 14 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSlot} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slots Table */}
      {slots.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No consultation slots yet</p>
          <p className="text-sm text-muted-foreground">
            Add slots to start accepting bookings
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map(slot => (
                <TableRow key={slot.id} className={!slot.is_active ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">
                    {DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                  </TableCell>
                  <TableCell>{slot.duration_minutes} min</TableCell>
                  <TableCell>
                    <Switch
                      checked={slot.is_active}
                      onCheckedChange={() => handleToggleActive(slot)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSlot(slot.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info card */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How It Works</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Slots repeat weekly on the specified day and time</li>
          <li>Leads can book up to {slots[0]?.booking_window_days || 14} days ahead</li>
          <li>Disabled slots won&apos;t be shown for new bookings</li>
        </ul>
      </div>
    </div>
  )
}
