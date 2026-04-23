-- ============================================
-- Contracts Module
-- ============================================

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'verzonden', 'ondertekend', 'actief', 'verlopen', 'opgezegd')),
    template TEXT DEFAULT 'freelance',
    -- Contract details
    start_date DATE,
    end_date DATE,
    hourly_rate DECIMAL(10,2),
    fixed_price DECIMAL(10,2),
    payment_terms TEXT DEFAULT '30 dagen',
    -- Content
    content TEXT,
    -- Signing
    signed_by_client TEXT,
    signed_at TIMESTAMPTZ,
    signature_url TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own contracts"
    ON contracts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts"
    ON contracts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts"
    ON contracts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts"
    ON contracts FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Updated at trigger
CREATE TRIGGER set_updated_at_contracts
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
