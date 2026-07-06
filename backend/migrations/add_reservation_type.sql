-- Add reservation_type column to reservations table
ALTER TABLE reservations ADD COLUMN reservation_type VARCHAR(20) DEFAULT 'normal';
