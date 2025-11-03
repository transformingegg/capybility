-- Add category column to barabots_metadata_updates table
ALTER TABLE barabots_metadata_updates
ADD COLUMN IF NOT EXISTS category VARCHAR(20);

-- Create index for category column
CREATE INDEX IF NOT EXISTS idx_barabots_metadata_updates_category 
ON barabots_metadata_updates (category);
