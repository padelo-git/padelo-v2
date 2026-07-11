-- Add player_index column to payments table
ALTER TABLE payments ADD COLUMN player_index INTEGER;

-- Update existing payments to set player_index based on player_name matching
-- This is a best-effort migration - existing payments may not have correct player_index
-- New payments will have the correct player_index
