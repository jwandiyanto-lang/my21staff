-- Add Kapso metadata cache fields to contacts table
-- These are populated from webhook data for instant inbox loading
-- Migration: 35_contacts_cache_fields.sql

-- Kapso profile metadata cache
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kapso_name VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kapso_profile_pic TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kapso_is_online BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kapso_last_seen TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS cache_updated_at TIMESTAMPTZ;

-- Add normalized phone column for consistent matching
-- E.164 format: +628123456789
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(20);

-- Index for online status filtering (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_contacts_kapso_online
  ON contacts(workspace_id, kapso_is_online)
  WHERE kapso_is_online = true;

-- Index for normalized phone lookup
CREATE INDEX IF NOT EXISTS idx_contacts_phone_normalized
  ON contacts(workspace_id, phone_normalized);

-- Backfill normalized phone for existing contacts
-- Basic normalization: strip spaces/dashes, add +62 if starts with 0
UPDATE contacts
SET phone_normalized = CASE
  WHEN phone LIKE '+%' THEN regexp_replace(phone, '[^0-9+]', '', 'g')
  WHEN phone LIKE '0%' THEN '+62' || regexp_replace(substring(phone from 2), '[^0-9]', '', 'g')
  WHEN phone LIKE '62%' THEN '+' || regexp_replace(phone, '[^0-9]', '', 'g')
  ELSE '+62' || regexp_replace(phone, '[^0-9]', '', 'g')
END
WHERE phone_normalized IS NULL;

-- Column comments for documentation
COMMENT ON COLUMN contacts.kapso_name IS 'WhatsApp profile name from Kapso webhook';
COMMENT ON COLUMN contacts.kapso_profile_pic IS 'WhatsApp profile picture URL from Kapso';
COMMENT ON COLUMN contacts.kapso_is_online IS 'Whether contact is currently online on WhatsApp';
COMMENT ON COLUMN contacts.kapso_last_seen IS 'Last seen timestamp from Kapso';
COMMENT ON COLUMN contacts.cache_updated_at IS 'When Kapso metadata was last refreshed';
COMMENT ON COLUMN contacts.phone_normalized IS 'E.164 normalized phone number for consistent matching';
