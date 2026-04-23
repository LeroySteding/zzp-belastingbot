-- Payment matches table for tracking Mollie (and other) payment-to-invoice matches
CREATE TABLE IF NOT EXISTS payment_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    provider TEXT NOT NULL CHECK (provider IN ('mollie', 'manual', 'bank')),
    external_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('matched', 'unmatched', 'ignored')),
    payment_date TIMESTAMPTZ,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_payment_matches_user_id ON payment_matches(user_id);

-- Index for finding existing matches by external payment id
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_matches_external_id ON payment_matches(provider, external_id) WHERE external_id IS NOT NULL;

-- Index for finding matches by invoice
CREATE INDEX IF NOT EXISTS idx_payment_matches_invoice_id ON payment_matches(invoice_id);

-- Enable Row Level Security
ALTER TABLE payment_matches ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment matches
CREATE POLICY "Users can view own payment matches"
    ON payment_matches FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own payment matches
CREATE POLICY "Users can insert own payment matches"
    ON payment_matches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment matches
CREATE POLICY "Users can update own payment matches"
    ON payment_matches FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own payment matches
CREATE POLICY "Users can delete own payment matches"
    ON payment_matches FOR DELETE
    USING (auth.uid() = user_id);
