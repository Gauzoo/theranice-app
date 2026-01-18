-- Fix for the "violates check constraint bookings_status_check" error

-- 1. Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 2. Re-create the constraint with all necessary statuses including 'pending_payment' and 'conflict_paid'
-- Adjust the list below if you have other statuses like 'pending'
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'pending', 'pending_payment', 'conflict', 'conflict_paid'));
