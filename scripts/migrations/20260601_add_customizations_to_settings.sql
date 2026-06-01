ALTER TABLE settings ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '{}'::jsonb;
