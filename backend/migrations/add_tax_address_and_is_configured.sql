-- Add tax_address, tax_condition, and is_configured fields to clubs table
ALTER TABLE clubs ADD COLUMN tax_address TEXT;
ALTER TABLE clubs ADD COLUMN tax_condition TEXT;
ALTER TABLE clubs ADD COLUMN is_configured BOOLEAN DEFAULT FALSE;
