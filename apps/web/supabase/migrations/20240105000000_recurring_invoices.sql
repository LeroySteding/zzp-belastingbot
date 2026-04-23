-- ============================================
-- Recurring Invoices - Add tracking column
-- ============================================

-- Add column to track which recurring invoice generated a given invoice
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS generated_from_recurring_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Index for efficiently querying generated invoices by their source recurring invoice
CREATE INDEX IF NOT EXISTS idx_invoices_generated_from_recurring_id
ON invoices(generated_from_recurring_id)
WHERE generated_from_recurring_id IS NOT NULL;

-- Index for efficiently finding due recurring invoices
CREATE INDEX IF NOT EXISTS idx_invoices_recurring_due
ON invoices(user_id, next_recurring_date)
WHERE recurring_frequency IS NOT NULL AND status != 'concept';
