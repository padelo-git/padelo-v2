-- Simplify payments table for robust multi-tenant architecture
-- This migration removes complex fields and ensures data isolation by club_id

-- Drop existing payments table and recreate with simplified structure
DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL, -- cash, transfer, card
    status VARCHAR(50) DEFAULT 'completed', -- completed, refunded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance and data isolation
CREATE INDEX idx_payments_club_id ON payments(club_id);
CREATE INDEX idx_payments_club_reservation ON payments(club_id, reservation_id);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);

-- Add comment for documentation
COMMENT ON TABLE payments IS 'Simplified payment tracking for multi-tenant architecture - each club has isolated payment data';
COMMENT ON COLUMN payments.club_id IS 'Club ID for data isolation - ensures each club has its own payment world';
COMMENT ON COLUMN payments.reservation_id IS 'Associated reservation';
COMMENT ON COLUMN payments.player_name IS 'Player name for payment tracking';
COMMENT ON COLUMN payments.amount IS 'Payment amount';
COMMENT ON COLUMN payments.method IS 'Payment method: cash, transfer, card';
COMMENT ON COLUMN payments.status IS 'Payment status: completed, refunded';
