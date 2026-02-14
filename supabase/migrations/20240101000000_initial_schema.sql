-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    btw_number TEXT,
    kvk_number TEXT,
    iban TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount_excl DECIMAL(10, 2) NOT NULL,
    btw_rate INTEGER NOT NULL CHECK (btw_rate IN (0, 9, 21)),
    btw_amount DECIMAL(10, 2) GENERATED ALWAYS AS (amount_excl * btw_rate / 100) STORED,
    amount_incl DECIMAL(10, 2) GENERATED ALWAYS AS (amount_excl * (1 + btw_rate / 100.0)) STORED,
    category TEXT NOT NULL CHECK (category IN ('Kantoor', 'Reizen', 'Software', 'Telefoon/Internet', 'Verzekeringen', 'Overig')),
    date DATE NOT NULL,
    receipt_path TEXT,
    quarter INTEGER GENERATED ALWAYS AS (EXTRACT(QUARTER FROM date)::INTEGER) STORED,
    year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)::INTEGER) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BTW Reports table
CREATE TABLE btw_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    total_excl DECIMAL(10, 2) NOT NULL,
    total_btw DECIMAL(10, 2) NOT NULL,
    total_incl DECIMAL(10, 2) NOT NULL,
    pdf_path TEXT,
    status TEXT NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'ingediend', 'betaald')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, year, quarter)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE btw_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses"
    ON expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
    ON expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
    ON expenses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
    ON expenses FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for btw_reports
CREATE POLICY "Users can view own reports"
    ON btw_reports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
    ON btw_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
    ON btw_reports FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
    ON btw_reports FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_expenses
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_btw_reports
    BEFORE UPDATE ON btw_reports
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_quarter_year ON expenses(quarter, year);
CREATE INDEX idx_btw_reports_user_id ON btw_reports(user_id);
CREATE INDEX idx_btw_reports_year_quarter ON btw_reports(year, quarter);
