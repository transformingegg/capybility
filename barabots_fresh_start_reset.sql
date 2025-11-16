-- Fresh start reset for BarabotsNFTv2 deployment
-- This script clears old contract data while preserving categories

-- Clear old whitelist data (generated from old contract)
DELETE FROM barabots_free_wl;
DELETE FROM barabots_discount_wl;

-- Clear old metadata updates (from old assembly/pairing system)
DELETE FROM barabots_metadata_updates;

-- Reset assembly status in quizzes table (if it exists)
-- Note: Check if your quizzes table has barabots_processed column
-- ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS barabots_processed BOOLEAN DEFAULT FALSE;
-- But we don't need to reset this as new quizzes will be created

-- Clear old contract pairings (if this table exists)
-- DELETE FROM barabots_pairings; -- Only if this table exists

-- Reset counters/sequences if needed
-- ALTER SEQUENCE barabots_metadata_updates_id_seq RESTART WITH 1; -- If using sequences

-- Verify the cleanup
SELECT
  (SELECT COUNT(*) FROM barabots_free_wl) as free_wl_count,
  (SELECT COUNT(*) FROM barabots_discount_wl) as discount_wl_count,
  (SELECT COUNT(*) FROM barabots_metadata_updates) as metadata_updates_count,
  (SELECT COUNT(*) FROM barabots_contract_categories) as categories_preserved;

-- Expected result: 0, 0, 0, [some number > 0 for categories]