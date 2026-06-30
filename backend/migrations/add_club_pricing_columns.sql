-- Add pricing columns to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS hourly_price DECIMAL(10,2);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS lesson_1_player_price DECIMAL(10,2);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS lesson_2_player_price DECIMAL(10,2);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS lesson_3_player_price DECIMAL(10,2);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS lesson_4_player_price DECIMAL(10,2);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS operating_hours_start VARCHAR(10);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS operating_hours_end VARCHAR(10);
