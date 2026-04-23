-- Lead Pipeline / CRM module for ZZP platform

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Contact info
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    job_title TEXT,
    -- Company info
    company_name TEXT NOT NULL,
    company_domain TEXT,
    company_linkedin TEXT,
    company_size TEXT,
    company_industry TEXT,
    company_location TEXT,
    -- Pipeline
    stage TEXT NOT NULL DEFAULT 'nieuw' CHECK (stage IN ('nieuw', 'gecontacteerd', 'geinteresseerd', 'offerte', 'gewonnen', 'verloren')),
    score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    value DECIMAL(10,2),
    -- Source
    source TEXT DEFAULT 'handmatig' CHECK (source IN ('handmatig', 'apollo', 'linkedin', 'website', 'referral')),
    apollo_search_id TEXT,
    -- Notes & tracking
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    -- Conversion
    converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view own leads"
    ON leads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
    ON leads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
    ON leads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
    ON leads FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for leads
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_stage ON leads(user_id, stage);
CREATE INDEX idx_leads_company_domain ON leads(company_domain) WHERE company_domain IS NOT NULL;
CREATE INDEX idx_leads_next_followup ON leads(next_followup_at) WHERE next_followup_at IS NOT NULL;

-- Updated_at trigger for leads
CREATE TRIGGER set_updated_at_leads
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- LEAD ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('notitie', 'email', 'telefoon', 'meeting', 'offerte', 'status_change', 'enrichment')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_activities (access via lead ownership)
CREATE POLICY "Users can view own lead activities"
    ON lead_activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead activities"
    ON lead_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead activities"
    ON lead_activities FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for lead_activities
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_user_id ON lead_activities(user_id);

-- ============================================
-- SAVED SEARCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    search_type TEXT NOT NULL CHECK (search_type IN ('company', 'contacts')),
    search_params JSONB NOT NULL,
    apollo_task_id TEXT,
    result_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_searches
CREATE POLICY "Users can view own saved searches"
    ON saved_searches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved searches"
    ON saved_searches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches"
    ON saved_searches FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
    ON saved_searches FOR DELETE
    USING (auth.uid() = user_id);

-- Index for saved_searches
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
