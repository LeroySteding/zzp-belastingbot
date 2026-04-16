-- Add KOR settings to profiles table
ALTER TABLE profiles 
ADD COLUMN kor_enabled BOOLEAN DEFAULT false,
ADD COLUMN kor_threshold DECIMAL(10, 2) DEFAULT 20000.00;

-- Add recurring expense fields to expenses table
ALTER TABLE expenses 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly', NULL)),
ADD COLUMN recurring_end_date DATE,
ADD COLUMN parent_recurring_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

-- Create bank_imports table for tracking imported statements
CREATE TABLE bank_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    bank_name TEXT CHECK (bank_name IN ('ING', 'Rabobank', 'ABN AMRO', 'Overig')),
    import_date TIMESTAMPTZ DEFAULT NOW(),
    total_transactions INTEGER NOT NULL,
    transactions_imported INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for bank_imports
ALTER TABLE bank_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank imports"
    ON bank_imports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank imports"
    ON bank_imports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank imports"
    ON bank_imports FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank imports"
    ON bank_imports FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_expenses_recurring ON expenses(is_recurring, user_id) WHERE is_recurring = true;
CREATE INDEX idx_expenses_parent_recurring ON expenses(parent_recurring_id) WHERE parent_recurring_id IS NOT NULL;
CREATE INDEX idx_bank_imports_user_id ON bank_imports(user_id);
CREATE INDEX idx_bank_imports_date ON bank_imports(import_date);

-- Add source field to track where expense came from
ALTER TABLE expenses 
ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'bank_import', 'recurring'));
