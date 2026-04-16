-- ============================================
-- ZZP Platform - Unified Schema Migration
-- Extends belastingbot schema with all modules
-- ============================================

-- Extend profiles with shared fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ============================================
-- CLIENTS (shared: factuur, uren, portal)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    address TEXT,
    kvk TEXT,
    btw_number TEXT,
    phone TEXT,
    notes TEXT,
    portal_access BOOLEAN DEFAULT false,
    portal_password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_clients_user_id ON clients(user_id);

CREATE TRIGGER set_updated_at_clients
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- PROJECTS (shared: uren, portal)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('offerte', 'active', 'review', 'completed', 'archived')),
    hourly_rate DECIMAL(10,2),
    budget_hours DECIMAL(10,2),
    deadline DATE,
    color TEXT DEFAULT '#3b82f6',
    portal_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);

CREATE TRIGGER set_updated_at_projects
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- INVOICES (factuur module)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'verzonden', 'betaald', 'verlopen')),
    notes TEXT,
    template TEXT DEFAULT 'modern',
    recurring_frequency TEXT CHECK (recurring_frequency IN ('maandelijks', 'kwartaal', NULL)),
    next_recurring_date DATE,
    subtotal DECIMAL(10,2),
    total_btw DECIMAL(10,2),
    total DECIMAL(10,2),
    pdf_url TEXT,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE TRIGGER set_updated_at_invoices
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- INVOICE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    btw_rate INTEGER NOT NULL CHECK (btw_rate IN (0, 9, 21)),
    btw_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price * btw_rate / 100) STORED,
    total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + btw_rate / 100.0)) STORED,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoice items" ON invoice_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can insert own invoice items" ON invoice_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update own invoice items" ON invoice_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete own invoice items" ON invoice_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================
-- TIME ENTRIES (uren module)
-- ============================================
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    billable BOOLEAN DEFAULT true,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own time entries" ON time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own time entries" ON time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON time_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time entries" ON time_entries FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_invoice_id ON time_entries(invoice_id);

CREATE TRIGGER set_updated_at_time_entries
    BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- TIMESHEETS (uren module)
-- ============================================
CREATE TABLE IF NOT EXISTS timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'goedgekeurd', 'gefactureerd')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own timesheets" ON timesheets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timesheets" ON timesheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timesheets" ON timesheets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timesheets" ON timesheets FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_timesheets_user_id ON timesheets(user_id);

-- ============================================
-- PROJECT MILESTONES (portal module)
-- ============================================
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    due_date DATE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project milestones" ON project_milestones FOR SELECT
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own project milestones" ON project_milestones FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own project milestones" ON project_milestones FOR UPDATE
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own project milestones" ON project_milestones FOR DELETE
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid()));

CREATE INDEX idx_project_milestones_project_id ON project_milestones(project_id);

-- ============================================
-- PROJECT FILES (portal module)
-- ============================================
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    portal_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project files" ON project_files FOR SELECT
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own project files" ON project_files FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own project files" ON project_files FOR DELETE
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid()));

CREATE INDEX idx_project_files_project_id ON project_files(project_id);

-- ============================================
-- PROJECT COMMENTS (portal module)
-- ============================================
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_client BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project comments" ON project_comments FOR SELECT
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_comments.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own project comments" ON project_comments FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_comments.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own project comments" ON project_comments FOR DELETE
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_comments.project_id AND projects.user_id = auth.uid()));

CREATE INDEX idx_project_comments_project_id ON project_comments(project_id);

-- ============================================
-- PORTAL SETTINGS (portal module)
-- ============================================
CREATE TABLE IF NOT EXISTS portal_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#3b82f6',
    portal_slug TEXT UNIQUE,
    custom_domain TEXT,
    welcome_email_subject TEXT,
    welcome_email_body TEXT,
    update_email_subject TEXT,
    update_email_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own portal settings" ON portal_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portal settings" ON portal_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portal settings" ON portal_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_portal_settings
    BEFORE UPDATE ON portal_settings
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
