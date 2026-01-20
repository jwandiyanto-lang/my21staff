export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ari_ai_comparison: {
        Row: {
          ai_model: string
          avg_response_time_ms: number | null
          conversation_count: number | null
          conversion_count: number | null
          created_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          satisfaction_score: number | null
          total_tokens_used: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          ai_model: string
          avg_response_time_ms?: number | null
          conversation_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          satisfaction_score?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          ai_model?: string
          avg_response_time_ms?: number | null
          conversation_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          satisfaction_score?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ari_ai_comparison_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ari_appointments: {
        Row: {
          ari_conversation_id: string
          consultant_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          notes: string | null
          payment_id: string | null
          reminder_sent_at: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          ari_conversation_id: string
          consultant_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          payment_id?: string | null
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          ari_conversation_id?: string
          consultant_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          payment_id?: string | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ari_appointments_ari_conversation_id_fkey"
            columns: ["ari_conversation_id"]
            isOneToOne: false
            referencedRelation: "ari_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ari_appointments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "ari_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ari_appointments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ari_config: {
        Row: {
          bot_name: string | null
          community_link: string | null
          created_at: string | null
          greeting_style: string | null
          id: string
          language: string | null
          tone: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          bot_name?: string | null
          community_link?: string | null
          created_at?: string | null
          greeting_style?: string | null
          id?: string
          language?: string | null
          tone?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          bot_name?: string | null
          community_link?: string | null
          created_at?: string | null
          greeting_style?: string | null
          id?: string
          language?: string | null
          tone?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ari_config_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ari_conversations: {
        Row: {
          ai_model: string | null
          contact_id: string
          context: Json | null
          conversation_id: string | null
          created_at: string | null
          handoff_at: string | null
          handoff_reason: string | null
          id: string
          last_ai_message_at: string | null
          lead_score: number | null
          lead_temperature: string | null
          state: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          ai_model?: string | null
          contact_id: string
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          handoff_at?: string | null
          handoff_reason?: string | null
          id?: string
          last_ai_message_at?: string | null
          lead_score?: number | null
          lead_temperature?: string | null
          state?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          ai_model?: string | null
          contact_id?: string
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          handoff_at?: string | null
          handoff_reason?: string | null
          id?: string
          last_ai_message_at?: string | null
          lead_score?: number | null
          lead_temperature?: string | null
          state?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ari_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ari_conversations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ari_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ari_destinations: {
        Row: {
          city: string | null
          country: string
          created_at: string | null
          id: string
          is_promoted: boolean | null
          notes: string | null
          priority: number | null
          programs: string[] | null
          requirements: Json | null
          university_name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string | null
          id?: string
          is_promoted?: boolean | null
          notes?: string | null
          priority?: number | null
          programs?: string[] | null
          requirements?: Json | null
          university_name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string | null
          id?: string
          is_promoted?: boolean | null
          notes?: string | null
          priority?: number | null
          programs?: string[] | null
          requirements?: Json | null
          university_name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ari_destinations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ari_messages: {
        Row: {
          ai_model: string | null
          ari_conversation_id: string
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          role: string
          tokens_used: number | null
          workspace_id: string
        }
        Insert: {
          ai_model?: string | null
          ari_conversation_id: string
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          role: string
          tokens_used?: number | null
          workspace_id: string
        }
        Update: {
          ai_model?: string | null
          ari_conversation_id?: string
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          role?: string
          tokens_used?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ari_messages_ari_conversation_id_fkey"
            columns: ["ari_conversation_id"]
            isOneToOne: false
            referencedRelation: "ari_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ari_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ari_payments: {
        Row: {
          amount: number
          ari_conversation_id: string
          created_at: string | null
          currency: string | null
          expires_at: string | null
          gateway: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          amount: number
          ari_conversation_id: string
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          gateway?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          ari_conversation_id?: string
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          gateway?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ari_payments_ari_conversation_id_fkey"
            columns: ["ari_conversation_id"]
            isOneToOne: false
            referencedRelation: "ari_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ari_payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_notes: {
        Row: {
          author_id: string
          completed_at: string | null
          contact_id: string
          content: string
          created_at: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          note_type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          completed_at?: string | null
          contact_id: string
          content: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          note_type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          completed_at?: string | null
          contact_id?: string
          content?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          note_type?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_slots: {
        Row: {
          booking_window_days: number | null
          consultant_id: string | null
          created_at: string | null
          day_of_week: number
          duration_minutes: number | null
          end_time: string
          id: string
          is_active: boolean | null
          max_bookings_per_slot: number | null
          start_time: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          booking_window_days?: number | null
          consultant_id?: string | null
          created_at?: string | null
          day_of_week: number
          duration_minutes?: number | null
          end_time: string
          id?: string
          is_active?: boolean | null
          max_bookings_per_slot?: number | null
          start_time: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          booking_window_days?: number | null
          consultant_id?: string | null
          created_at?: string | null
          day_of_week?: number
          duration_minutes?: number | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_bookings_per_slot?: number | null
          start_time?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_slots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_to: string | null
          cache_updated_at: string | null
          created_at: string | null
          email: string | null
          id: string
          kapso_is_online: boolean | null
          kapso_last_seen: string | null
          kapso_name: string | null
          kapso_profile_pic: string | null
          lead_score: number | null
          lead_status: string | null
          metadata: Json | null
          name: string | null
          phone: string
          phone_normalized: string | null
          tags: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          cache_updated_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          kapso_is_online?: boolean | null
          kapso_last_seen?: string | null
          kapso_name?: string | null
          kapso_profile_pic?: string | null
          lead_score?: number | null
          lead_status?: string | null
          metadata?: Json | null
          name?: string | null
          phone: string
          phone_normalized?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          cache_updated_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          kapso_is_online?: boolean | null
          kapso_last_seen?: string | null
          kapso_name?: string | null
          kapso_profile_pic?: string | null
          lead_score?: number | null
          lead_status?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string
          phone_normalized?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          contact_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      flows: {
        Row: {
          actions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          actions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          actions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string | null
          description: string | null
          fields: Json
          id: string
          is_active: boolean | null
          name: string
          scoring_rules: Json | null
          slug: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name: string
          scoring_rules?: Json | null
          slug: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          scoring_rules?: Json | null
          slug?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          priority: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords: string[]
          priority?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          priority?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          kapso_message_id: string | null
          media_url: string | null
          message_type: string | null
          metadata: Json | null
          sender_id: string | null
          sender_type: string
          workspace_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          kapso_message_id?: string | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type: string
          workspace_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          kapso_message_id?: string | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          is_stage_change: boolean | null
          ticket_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_stage_change?: boolean | null
          ticket_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_stage_change?: boolean | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string
          created_at: string | null
          from_stage: string | null
          id: string
          reason: string | null
          ticket_id: string
          to_stage: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          from_stage?: string | null
          id?: string
          reason?: string | null
          ticket_id: string
          to_stage: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          from_stage?: string | null
          id?: string
          reason?: string | null
          ticket_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          admin_workspace_id: string | null
          approval_requested_at: string | null
          assigned_to: string | null
          category: string
          closed_at: string | null
          created_at: string | null
          description: string
          id: string
          pending_approval: boolean | null
          pending_stage: string | null
          priority: string
          reopen_token: string | null
          requester_id: string
          stage: string
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          admin_workspace_id?: string | null
          approval_requested_at?: string | null
          assigned_to?: string | null
          category: string
          closed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          pending_approval?: boolean | null
          pending_stage?: string | null
          priority: string
          reopen_token?: string | null
          requester_id: string
          stage?: string
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          admin_workspace_id?: string | null
          approval_requested_at?: string | null
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          pending_approval?: boolean | null
          pending_stage?: string | null
          priority?: string
          reopen_token?: string | null
          requester_id?: string
          stage?: string
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_admin_workspace_id_fkey"
            columns: ["admin_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_todos: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_todos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          name: string | null
          role: string | null
          status: string | null
          token: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
          token: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
          token?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          must_change_password: boolean | null
          role: string | null
          settings: Json | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          must_change_password?: boolean | null
          role?: string | null
          settings?: Json | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          must_change_password?: boolean | null
          role?: string | null
          settings?: Json | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          kapso_phone_id: string | null
          meta_access_token: string | null
          meta_business_account_id: string | null
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          status: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string | null
          wa_phone_number: string | null
          workspace_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          kapso_phone_id?: string | null
          meta_access_token?: string | null
          meta_business_account_id?: string | null
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          status?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          wa_phone_number?: string | null
          workspace_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          kapso_phone_id?: string | null
          meta_access_token?: string | null
          meta_business_account_id?: string | null
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          status?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          wa_phone_number?: string | null
          workspace_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_workspace_by_phone_id: { Args: { phone_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// =============================================================================
// Convenience type aliases for common table rows
// =============================================================================
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactNote = Database['public']['Tables']['contact_notes']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type WorkspaceInvitation = Database['public']['Tables']['workspace_invitations']['Row']
export type Ticket = Database['public']['Tables']['tickets']['Row']
export type TicketComment = Database['public']['Tables']['ticket_comments']['Row']
export type TicketStatusHistory = Database['public']['Tables']['ticket_status_history']['Row']

// =============================================================================
// ARI (AI Receptionist Indonesia) Types
// =============================================================================
export type ARIConfig = Database['public']['Tables']['ari_config']['Row']
export type ARIConversation = Database['public']['Tables']['ari_conversations']['Row']
export type ARIMessage = Database['public']['Tables']['ari_messages']['Row']
export type ARIDestination = Database['public']['Tables']['ari_destinations']['Row']
export type ARIPayment = Database['public']['Tables']['ari_payments']['Row']
export type ARIAppointment = Database['public']['Tables']['ari_appointments']['Row']
export type ARIAIComparison = Database['public']['Tables']['ari_ai_comparison']['Row']

// =============================================================================
// Manual type definitions for tables not yet in remote database
// (Migration 05_website_content.sql needs to be applied)
// =============================================================================
export type Article = {
  id: string
  workspace_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image_url: string | null
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

export type Webinar = {
  id: string
  workspace_id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  scheduled_at: string
  duration_minutes: number
  meeting_url: string | null
  max_registrations: number | null
  status: 'draft' | 'published' | 'completed' | 'cancelled'
  published_at: string | null
  created_at: string
  updated_at: string
}

// Extended types with joins
export type ConversationWithContact = Conversation & {
  contact: Contact
}
