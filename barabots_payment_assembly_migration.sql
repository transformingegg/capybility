-- Update barabots_metadata_updates table for payment-based assembly
-- Rename signature column to assembly_transaction_hash since we now store payment tx hash instead of signature

ALTER TABLE barabots_metadata_updates
RENAME COLUMN signature TO assembly_transaction_hash;

-- Make it NOT NULL since every assembly will have a payment transaction
ALTER TABLE barabots_metadata_updates
ALTER COLUMN assembly_transaction_hash SET NOT NULL;

-- Update the comment to reflect the change
COMMENT ON COLUMN barabots_metadata_updates.assembly_transaction_hash IS 'Transaction hash of the EDU payment used for assembly';