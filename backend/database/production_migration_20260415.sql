-- Production Migration Script
-- Date: 2026-04-15
-- Description: Adds missing columns for marketing tracking and model registration photos.

-- 1. Updates to Models Table
ALTER TABLE models ADD COLUMN IF NOT EXISTS photo_profile_reg TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS marketing_src VARCHAR(255);
ALTER TABLE models ADD COLUMN IF NOT EXISTS marketing_camp VARCHAR(255);
ALTER TABLE models ADD COLUMN IF NOT EXISTS marketing_ad VARCHAR(255);

-- 2. Updates to Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_src VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_camp VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_ad VARCHAR(255);

-- 3. Update comments for documentation
COMMENT ON COLUMN models.photo_profile_reg IS 'Stores the original registration photo of the model';
COMMENT ON COLUMN models.marketing_src IS 'Original traffic source for model registration';
COMMENT ON COLUMN users.marketing_src IS 'Original traffic source for user registration';
