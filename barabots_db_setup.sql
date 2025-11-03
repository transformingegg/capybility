-- Barabots Free Mint Whitelist Table
-- Stores wallet addresses eligible for free Barabots mints
-- Allows multiple entries per wallet (no unique constraints)
CREATE TABLE barabots_free_wl (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL, -- Ethereum address format
    category VARCHAR(20), -- BUILD, WORK, DEFI, LEARN, CULTURE (NULL = random)
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by VARCHAR(42), -- Admin wallet that added them
    notes TEXT,
    used BOOLEAN DEFAULT FALSE, -- Set to TRUE when mint is used
    used_at TIMESTAMP WITH TIME ZONE
);

-- Barabots Discount Mint Whitelist Table
-- Stores wallet addresses eligible for discounted Barabots mints
-- Allows multiple entries per wallet (no unique constraints)
CREATE TABLE barabots_discount_wl (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL, -- Ethereum address format
    category VARCHAR(20), -- BUILD, WORK, DEFI, LEARN, CULTURE (NULL = random)
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by VARCHAR(42), -- Admin wallet that added them
    notes TEXT,
    used BOOLEAN DEFAULT FALSE, -- Set to TRUE when mint is used
    used_at TIMESTAMP WITH TIME ZONE
);

-- Barabots Contract Categorization
-- Maps contract addresses to categories for transaction pairing validation
CREATE TABLE barabots_contract_categories (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(42) NOT NULL UNIQUE, -- Ethereum contract address
    category VARCHAR(20), -- BUILD, WORK, DEFI, LEARN, CULTURE, unknown (NULL = unassigned)
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by VARCHAR(42), -- Admin wallet that categorized it
    notes TEXT, -- Contract name or description from Blockscout
    CHECK (category IS NULL OR category IN ('BUILD', 'WORK', 'DEFI', 'LEARN', 'CULTURE', 'unknown'))
);

-- Barabots Metadata Updates Table
-- Tracks NFT metadata changes and transaction pairings
CREATE TABLE barabots_metadata_updates (
    id SERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL,
    wallet_address VARCHAR(42) NOT NULL, -- Owner wallet address
    transaction_hash VARCHAR(66) NOT NULL, -- Ethereum transaction hash
    contract_address VARCHAR(42), -- Contract address from the transaction
    category VARCHAR(20), -- NFT category (BUILD, WORK, DEFI, LEARN, CULTURE)
    signature TEXT NOT NULL, -- Signature for the pairing
    paired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved BOOLEAN DEFAULT FALSE, -- Admin approval for metadata update
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(42), -- Admin wallet that approved
    UNIQUE(token_id, transaction_hash) -- Prevent duplicate pairings
);

-- Create indexes for performance
CREATE INDEX idx_barabots_free_wl_wallet_address ON barabots_free_wl (wallet_address);
CREATE INDEX idx_barabots_free_wl_used ON barabots_free_wl (used);
CREATE INDEX idx_barabots_free_wl_category ON barabots_free_wl (category);

CREATE INDEX idx_barabots_discount_wl_wallet_address ON barabots_discount_wl (wallet_address);
CREATE INDEX idx_barabots_discount_wl_used ON barabots_discount_wl (used);
CREATE INDEX idx_barabots_discount_wl_category ON barabots_discount_wl (category);

CREATE INDEX idx_barabots_contract_categories_contract_address ON barabots_contract_categories (contract_address);
CREATE INDEX idx_barabots_contract_categories_category ON barabots_contract_categories (category);

CREATE INDEX idx_barabots_metadata_updates_token_id ON barabots_metadata_updates (token_id);
CREATE INDEX idx_barabots_metadata_updates_wallet_address ON barabots_metadata_updates (wallet_address);
CREATE INDEX idx_barabots_metadata_updates_transaction_hash ON barabots_metadata_updates (transaction_hash);
CREATE INDEX idx_barabots_metadata_updates_contract_address ON barabots_metadata_updates (contract_address);
CREATE INDEX idx_barabots_metadata_updates_category ON barabots_metadata_updates (category);
CREATE INDEX idx_barabots_metadata_updates_approved ON barabots_metadata_updates (approved);