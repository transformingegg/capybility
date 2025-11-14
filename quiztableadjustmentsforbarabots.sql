-- Migration: Add Barabots quiz support columns to quizzes table
-- Safe to run multiple times (uses IF NOT EXISTS checks)

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS is_barabots_quiz BOOLEAN DEFAULT FALSE;

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS barabots_category VARCHAR(16);

-- Change existing column type if it exists as INTEGER
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quizzes' 
        AND column_name = 'barabots_duration_days' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE quizzes ALTER COLUMN barabots_duration_days TYPE DECIMAL(10,6);
    ELSE
        ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS barabots_duration_days DECIMAL(10,6);
    END IF;
END $$;

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS barabots_end_date TIMESTAMP;

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS barabots_processed BOOLEAN DEFAULT FALSE;

-- Index for fast lookup of unprocessed Barabots quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_barabots_unprocessed
ON quizzes (is_barabots_quiz, barabots_processed, barabots_end_date);

-- End of migration
