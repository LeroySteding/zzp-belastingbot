-- PSD2 Bank Connections
--
-- This table stores OAuth2 tokens and connection metadata for PSD2 bank
-- integrations. Tokens are encrypted at the application level using
-- AES-256-GCM before being stored here.
--
-- PSD2 consent has a maximum validity of 90 days (per EU regulation).
-- After that, the user must re-authenticate (SCA) with their bank.

CREATE TABLE IF NOT EXISTS bank_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank TEXT NOT NULL CHECK (bank IN ('rabobank', 'revolut', 'bunq', 'knab')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'expired', 'revoked')),
    consent_id TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    accounts JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Each user can only have one connection per bank
    UNIQUE(user_id, bank)
);

-- Enable Row Level Security
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own bank connections

CREATE POLICY "Users can view own bank connections"
    ON bank_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank connections"
    ON bank_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank connections"
    ON bank_connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank connections"
    ON bank_connections FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_status ON bank_connections(status);
CREATE INDEX idx_bank_connections_user_bank ON bank_connections(user_id, bank);

-- Update the bank_imports table to support PSD2 source
-- (existing bank_name check may be too restrictive; add 'Knab' and 'Revolut' if missing)
DO $$
BEGIN
    -- Add psd2_sync source option to expenses table
    ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_source_check;
    ALTER TABLE expenses ADD CONSTRAINT expenses_source_check
        CHECK (source IN ('manual', 'bank_import', 'recurring', 'psd2_sync'));
EXCEPTION
    WHEN others THEN
        -- Constraint may not exist yet; that's OK
        NULL;
END $$;

-- Add bank_connection_id to bank_imports to link PSD2 syncs to their connection
ALTER TABLE bank_imports
    ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id) ON DELETE SET NULL;
