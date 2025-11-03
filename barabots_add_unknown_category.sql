-- Add 'unknown' to allowed categories in barabots_contract_categories
-- First drop the existing constraint
ALTER TABLE barabots_contract_categories 
DROP CONSTRAINT IF EXISTS barabots_contract_categories_category_check;

-- Add new constraint that includes 'unknown'
ALTER TABLE barabots_contract_categories
ADD CONSTRAINT barabots_contract_categories_category_check 
CHECK (category IN ('BUILD', 'WORK', 'DEFI', 'LEARN', 'CULTURE', 'unknown'));
