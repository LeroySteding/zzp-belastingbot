-- ============================================
-- ZZP Platform - Team Access / Multi-user
-- Allows accountants and team members to access
-- a ZZP'er's data based on role/permissions
-- ============================================

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_email TEXT NOT NULL,
    member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('boekhouder', 'medewerker', 'readonly')),
    permissions JSONB DEFAULT '{"factuur": true, "uren": false, "belasting": true, "portal": false}'::jsonb,
    status TEXT NOT NULL DEFAULT 'uitgenodigd' CHECK (status IN ('uitgenodigd', 'actief', 'geblokkeerd')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Owner can manage their team members
CREATE POLICY "Owners can view their team members"
    ON team_members FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert team members"
    ON team_members FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their team members"
    ON team_members FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their team members"
    ON team_members FOR DELETE
    USING (auth.uid() = owner_id);

-- Members can view their own membership records
CREATE POLICY "Members can view own memberships"
    ON team_members FOR SELECT
    USING (auth.uid() = member_user_id);

-- Members can update their own record (for accepting invitations)
CREATE POLICY "Members can accept invitations"
    ON team_members FOR UPDATE
    USING (auth.uid() = member_user_id)
    WITH CHECK (auth.uid() = member_user_id);

-- Unique constraint: one invitation per owner+email pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_unique
    ON team_members(owner_id, member_email);

-- Index for looking up memberships by member
CREATE INDEX IF NOT EXISTS idx_team_members_member
    ON team_members(member_user_id)
    WHERE member_user_id IS NOT NULL;

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS idx_team_members_owner
    ON team_members(owner_id);

-- ============================================
-- HELPER FUNCTION: can_access_user_data
-- Used by RLS policies to check if the current
-- user can access another user's data (either
-- as owner or as an active team member)
-- ============================================
CREATE OR REPLACE FUNCTION can_access_user_data(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct owner always has access
  IF auth.uid() = target_user_id THEN RETURN TRUE; END IF;
  -- Active team member has access
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE owner_id = target_user_id
    AND member_user_id = auth.uid()
    AND status = 'actief'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE RLS SELECT POLICIES ON KEY TABLES
-- Drop existing SELECT policies and recreate
-- them using can_access_user_data()
-- ============================================

-- INVOICES
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view accessible invoices"
    ON invoices FOR SELECT
    USING (can_access_user_data(user_id));

-- EXPENSES
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view accessible expenses"
    ON expenses FOR SELECT
    USING (can_access_user_data(user_id));

-- CLIENTS
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
CREATE POLICY "Users can view accessible clients"
    ON clients FOR SELECT
    USING (can_access_user_data(user_id));

-- PROJECTS
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view accessible projects"
    ON projects FOR SELECT
    USING (can_access_user_data(user_id));

-- TIME ENTRIES
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
CREATE POLICY "Users can view accessible time entries"
    ON time_entries FOR SELECT
    USING (can_access_user_data(user_id));

-- PROFILES (uses id instead of user_id)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view accessible profiles"
    ON profiles FOR SELECT
    USING (can_access_user_data(id));

-- BTW REPORTS
DROP POLICY IF EXISTS "Users can view own reports" ON btw_reports;
CREATE POLICY "Users can view accessible btw reports"
    ON btw_reports FOR SELECT
    USING (can_access_user_data(user_id));

-- TIMESHEETS
DROP POLICY IF EXISTS "Users can view own timesheets" ON timesheets;
CREATE POLICY "Users can view accessible timesheets"
    ON timesheets FOR SELECT
    USING (can_access_user_data(user_id));

-- BANK IMPORTS
DROP POLICY IF EXISTS "Users can view own bank imports" ON bank_imports;
CREATE POLICY "Users can view accessible bank imports"
    ON bank_imports FOR SELECT
    USING (can_access_user_data(user_id));

-- INVOICE ITEMS (accessed via invoice join)
DROP POLICY IF EXISTS "Users can view own invoice items" ON invoice_items;
CREATE POLICY "Users can view accessible invoice items"
    ON invoice_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = invoice_items.invoice_id
        AND can_access_user_data(invoices.user_id)
    ));

-- PROJECT MILESTONES (accessed via project join)
DROP POLICY IF EXISTS "Users can view own project milestones" ON project_milestones;
CREATE POLICY "Users can view accessible project milestones"
    ON project_milestones FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_milestones.project_id
        AND can_access_user_data(projects.user_id)
    ));

-- PROJECT FILES (accessed via project join)
DROP POLICY IF EXISTS "Users can view own project files" ON project_files;
CREATE POLICY "Users can view accessible project files"
    ON project_files FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_files.project_id
        AND can_access_user_data(projects.user_id)
    ));

-- PROJECT COMMENTS (accessed via project join)
DROP POLICY IF EXISTS "Users can view own project comments" ON project_comments;
CREATE POLICY "Users can view accessible project comments"
    ON project_comments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_comments.project_id
        AND can_access_user_data(projects.user_id)
    ));

-- PORTAL SETTINGS
DROP POLICY IF EXISTS "Users can view own portal settings" ON portal_settings;
CREATE POLICY "Users can view accessible portal settings"
    ON portal_settings FOR SELECT
    USING (can_access_user_data(user_id));
