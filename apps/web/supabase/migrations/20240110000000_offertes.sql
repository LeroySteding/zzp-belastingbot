-- ============================================
-- OFFERTES (quotes/proposals)
-- ============================================
CREATE TABLE IF NOT EXISTS offertes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    offerte_number TEXT NOT NULL,
    date DATE NOT NULL,
    valid_until DATE NOT NULL,
    status TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'verzonden', 'geaccepteerd', 'afgewezen', 'verlopen')),
    notes TEXT,
    template TEXT DEFAULT 'modern',
    subtotal DECIMAL(10,2),
    total_btw DECIMAL(10,2),
    total DECIMAL(10,2),
    converted_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE offertes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own offertes" ON offertes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own offertes" ON offertes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own offertes" ON offertes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own offertes" ON offertes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_offertes_user_id ON offertes(user_id);
CREATE INDEX idx_offertes_client_id ON offertes(client_id);
CREATE INDEX idx_offertes_status ON offertes(status);

CREATE TRIGGER set_updated_at_offertes
    BEFORE UPDATE ON offertes
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- OFFERTE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS offerte_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offerte_id UUID NOT NULL REFERENCES offertes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    btw_rate INTEGER NOT NULL CHECK (btw_rate IN (0, 9, 21)),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE offerte_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own offerte items" ON offerte_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM offertes WHERE offertes.id = offerte_items.offerte_id AND offertes.user_id = auth.uid()));
CREATE POLICY "Users can insert own offerte items" ON offerte_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM offertes WHERE offertes.id = offerte_items.offerte_id AND offertes.user_id = auth.uid()));
CREATE POLICY "Users can update own offerte items" ON offerte_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM offertes WHERE offertes.id = offerte_items.offerte_id AND offertes.user_id = auth.uid()));
CREATE POLICY "Users can delete own offerte items" ON offerte_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM offertes WHERE offertes.id = offerte_items.offerte_id AND offertes.user_id = auth.uid()));

CREATE INDEX idx_offerte_items_offerte_id ON offerte_items(offerte_id);

-- ============================================
-- PAYMENT REMINDERS - Add columns to invoices
-- ============================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;
