-- Migration: 18_contacts_assigned_to.sql
-- Add assigned_to column to contacts table for team assignment

-- Add assigned_to column
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Create index for faster lookups by assignee
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
