-- Migration: Make category column nullable in barabots_contract_categories
-- This allows contracts to be added without a category initially (unassigned state)

-- Step 1: Drop the NOT NULL constraint on category
ALTER TABLE barabots_contract_categories 
ALTER COLUMN category DROP NOT NULL;

-- Step 2: Update the CHECK constraint to allow NULL
ALTER TABLE barabots_contract_categories
DROP CONSTRAINT IF EXISTS barabots_contract_categories_category_check;

ALTER TABLE barabots_contract_categories
ADD CONSTRAINT barabots_contract_categories_category_check 
CHECK (category IS NULL OR category IN ('BUILD', 'WORK', 'DEFI', 'LEARN', 'CULTURE', 'unknown'));

-- Step 3: Add notes column if it doesn't exist (for storing contract names)
ALTER TABLE barabots_contract_categories
ADD COLUMN IF NOT EXISTS notes TEXT;
