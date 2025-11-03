-- Migration: Allow unlimited entries per wallet in whitelist tables
-- This allows a wallet to have multiple entries in the same whitelist with any categories (including duplicates)

-- Drop existing unique constraints (both simple and composite)
ALTER TABLE barabots_free_wl DROP CONSTRAINT IF EXISTS barabots_free_wl_wallet_address_key;
ALTER TABLE barabots_free_wl DROP CONSTRAINT IF EXISTS barabots_free_wl_wallet_category_unique;
ALTER TABLE barabots_discount_wl DROP CONSTRAINT IF EXISTS barabots_discount_wl_wallet_address_key;
ALTER TABLE barabots_discount_wl DROP CONSTRAINT IF EXISTS barabots_discount_wl_wallet_category_unique;

-- No new constraints added - wallets can now have unlimited entries
-- This allows complete flexibility for whitelist management