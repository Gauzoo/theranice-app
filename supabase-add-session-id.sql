
-- Add stripe_session_id column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Update status check constraint if it exists (assuming it might be a text column, but if it's an enum, we need to add 'pending_payment')
-- Checking if it's a check constraint on text or an enum type
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'pending_payment';
    END IF;
END$$;

-- Fallback if status is a text column with checks, we might need to drop constraint.
-- But given the previous code insert strings directly, it's likely a text column or an enum.
-- If it's a simple text column, no change needed. 
