-- Waitlist table for email capture
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    referrer TEXT,
    user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public can insert (no auth required)
CREATE POLICY "Anyone can subscribe to waitlist"
    ON waitlist FOR INSERT
    WITH CHECK (true);

-- Only admins can view (you can adjust this later)
CREATE POLICY "Service role can view waitlist"
    ON waitlist FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');

-- Create index for performance
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_subscribed_at ON waitlist(subscribed_at DESC);
