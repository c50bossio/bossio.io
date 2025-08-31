-- Add guest booking fields to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Make client_id nullable for guest bookings
ALTER TABLE appointments 
ALTER COLUMN client_id DROP NOT NULL;

-- Add index on guest_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_guest_email ON appointments(guest_email);

-- Add check constraint to ensure either client_id or guest fields are present
ALTER TABLE appointments
ADD CONSTRAINT appointments_booking_type_check 
CHECK (
  client_id IS NOT NULL OR 
  (guest_name IS NOT NULL AND (guest_email IS NOT NULL OR guest_phone IS NOT NULL))
);