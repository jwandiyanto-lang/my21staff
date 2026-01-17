export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          kapso_phone_id: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          kapso_phone_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          kapso_phone_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: string
          must_change_password: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: string
          must_change_password?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: string
          must_change_password?: boolean
          created_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          workspace_id: string
          phone: string
          name: string | null
          email: string | null
          lead_score: number
          lead_status: string
          tags: string[]
          assigned_to: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          phone: string
          name?: string | null
          email?: string | null
          lead_score?: number
          lead_status?: string
          tags?: string[]
          assigned_to?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          phone?: string
          name?: string | null
          email?: string | null
          lead_score?: number
          lead_status?: string
          tags?: string[]
          assigned_to?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          workspace_id: string
          contact_id: string
          status: string
          assigned_to: string | null
          unread_count: number
          last_message_at: string | null
          last_message_preview: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          contact_id: string
          status?: string
          assigned_to?: string | null
          unread_count?: number
          last_message_at?: string | null
          last_message_preview?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          contact_id?: string
          status?: string
          assigned_to?: string | null
          unread_count?: number
          last_message_at?: string | null
          last_message_preview?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          workspace_id: string
          direction: string
          sender_type: string
          sender_id: string | null
          content: string | null
          message_type: string
          media_url: string | null
          kapso_message_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          workspace_id: string
          direction: string
          sender_type: string
          sender_id?: string | null
          content?: string | null
          message_type?: string
          media_url?: string | null
          kapso_message_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          workspace_id?: string
          direction?: string
          sender_type?: string
          sender_id?: string | null
          content?: string | null
          message_type?: string
          media_url?: string | null
          kapso_message_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_notes: {
        Row: {
          id: string
          contact_id: string
          workspace_id: string
          author_id: string
          content: string
          note_type: string
          metadata: Json
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          workspace_id: string
          author_id: string
          content: string
          note_type?: string
          metadata?: Json
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          workspace_id?: string
          author_id?: string
          content?: string
          note_type?: string
          metadata?: Json
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_workspace_by_phone_id: {
        Args: { phone_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ContactNote = Database['public']['Tables']['contact_notes']['Row']

// Invitation type (not yet in generated types)
export interface WorkspaceInvitation {
  id: string
  workspace_id: string
  email: string
  role: string
  token: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  invited_by: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
}

// With author
export type ContactNoteWithAuthor = ContactNote & {
  author?: Profile
}

// With relations
export type ConversationWithContact = Conversation & {
  contact: Contact
}

export type MessageWithSender = Message & {
  sender?: Profile
}

// Website Manager types
export interface Article {
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

export interface Webinar {
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

export interface WebinarRegistration {
  id: string
  webinar_id: string
  contact_id: string
  workspace_id: string
  registered_at: string
  attended: boolean
}

// Joined type for displaying registrations with contact info
export interface WebinarRegistrationWithContact extends WebinarRegistration {
  contact: Contact
}
