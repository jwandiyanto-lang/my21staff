'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Video, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  consultant_id: string | null
  consultant_name?: string
}

interface AppointmentCardProps {
  workspaceId: string
  contactId: string
}

export function AppointmentCard({ workspaceId, contactId }: AppointmentCardProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAppointment()
  }, [contactId])

  async function fetchAppointment() {
    try {
      const supabase = createClient()

      // Get the most recent upcoming or past appointment for this contact
      // Join through ari_conversations to get appointments for this contact
      const { data, error } = await supabase
        .from('ari_appointments')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          meeting_link,
          status,
          consultant_id,
          ari_conversations!inner (
            contact_id
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('ari_conversations.contact_id', contactId)
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Failed to fetch appointment:', error)
        return
      }

      if (data && data.status && data.duration_minutes !== null) {
        // Validate required fields
        const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as const
        if (!validStatuses.includes(data.status as typeof validStatuses[number])) {
          console.error('Invalid appointment status:', data.status)
          return
        }

        // Optionally fetch consultant name if consultant_id exists
        let consultantName: string | undefined
        if (data.consultant_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', data.consultant_id)
            .single()

          consultantName = profile?.full_name ?? profile?.email ?? undefined
        }

        setAppointment({
          id: data.id,
          scheduled_at: data.scheduled_at,
          duration_minutes: data.duration_minutes,
          meeting_link: data.meeting_link,
          status: data.status as Appointment['status'],
          consultant_id: data.consultant_id,
          consultant_name: consultantName,
        })
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStatusUpdate(newStatus: 'completed' | 'no_show' | 'cancelled') {
    if (!appointment) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('ari_appointments')
        .update({ status: newStatus })
        .eq('id', appointment.id)

      if (error) throw error

      setAppointment({ ...appointment, status: newStatus })
      toast.success(
        newStatus === 'completed' ? 'Marked as completed' :
        newStatus === 'no_show' ? 'Marked as no-show' :
        'Appointment cancelled'
      )
    } catch (error) {
      toast.error('Gagal mengubah status')
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded-lg h-24" />
    )
  }

  if (!appointment) {
    return null // No appointment to display
  }

  const aptDate = new Date(appointment.scheduled_at)
  const isPast = aptDate < new Date()
  const isUpcoming = !isPast && (appointment.status === 'scheduled' || appointment.status === 'confirmed')

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-600',
    confirmed: 'bg-green-500/10 text-green-600',
    completed: 'bg-gray-500/10 text-gray-600',
    cancelled: 'bg-red-500/10 text-red-600',
    no_show: 'bg-orange-500/10 text-orange-600',
  }

  const statusLabels: Record<string, string> = {
    scheduled: 'Terjadwal',
    confirmed: 'Dikonfirmasi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    no_show: 'No Show',
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Konsultasi</span>
        </div>
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          statusColors[appointment.status]
        )}>
          {statusLabels[appointment.status]}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Date and Time */}
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              {aptDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {aptDate.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })} WIB - {appointment.duration_minutes} menit
            </p>
          </div>
        </div>

        {/* Consultant */}
        {appointment.consultant_name && (
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{appointment.consultant_name}</span>
          </div>
        )}

        {/* Meeting Link */}
        {appointment.meeting_link && isUpcoming && (
          <a
            href={appointment.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Video className="w-4 h-4" />
            Join Meeting
          </a>
        )}

        {/* Action Buttons (for past appointments) */}
        {isPast && appointment.status !== 'completed' && appointment.status !== 'no_show' && appointment.status !== 'cancelled' && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-green-600 hover:text-green-700"
              onClick={() => handleStatusUpdate('completed')}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Selesai
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-orange-600 hover:text-orange-700"
              onClick={() => handleStatusUpdate('no_show')}
            >
              <XCircle className="w-3 h-3 mr-1" />
              No Show
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
