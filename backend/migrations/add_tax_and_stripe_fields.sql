-- Add tax and Stripe fields to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS tax_id VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS tax_id_type VARCHAR(50) DEFAULT 'none';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stripe_public_key VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stripe_secret_key VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stripe_webhook_secret VARCHAR(255);
