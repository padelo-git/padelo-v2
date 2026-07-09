-- Create reservation_payment_participants table
CREATE TABLE IF NOT EXISTS reservation_payment_participants (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_titular BOOLEAN DEFAULT FALSE,
    due_amount NUMERIC(10, 3) NOT NULL DEFAULT 0,
    due_precision INTEGER DEFAULT 3,
    status VARCHAR(50) DEFAULT 'pending',
    paid_amount NUMERIC(10, 2),
    payment_method VARCHAR(50),
    cash_register_id INTEGER REFERENCES cash_registers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reservation_payment_participants_reservation_id ON reservation_payment_participants(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payment_participants_club_id ON reservation_payment_participants(club_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payment_participants_status ON reservation_payment_participants(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reservation_payment_participants_updated_at 
    BEFORE UPDATE ON reservation_payment_participants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
