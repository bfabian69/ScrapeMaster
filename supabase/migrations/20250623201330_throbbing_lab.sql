/*
  # Add state column to PTC table

  1. Schema Changes
    - Add `state` column to `ptc` table
    - Update existing records with appropriate state values
    - Create index on state column for better performance

  2. Data Updates
    - Populate state column for existing utilities
    - Ensure all utilities have proper state assignments
*/

-- Add state column to PTC table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ptc' AND column_name = 'state'
  ) THEN
    ALTER TABLE ptc ADD COLUMN state TEXT;
  END IF;
END $$;

-- Update existing records with state information
UPDATE ptc SET state = 'Illinois' WHERE utility IN ('ComEd', 'Ameren');
UPDATE ptc SET state = 'Massachusetts' WHERE utility IN ('Eversource - NSTAR', 'Eversource - WMECO', 'Nat Grid - MA');
UPDATE ptc SET state = 'Ohio' WHERE utility IN ('Ohio Edison', 'Duke Energy', 'AEP - Ohio Power', 'AEP Columbus', 'Toledo Edison', 'The Illuminating Company');
UPDATE ptc SET state = 'Pennsylvania' WHERE utility IN ('PPL Electric', 'Met-Ed', 'PECO Energy', 'Penelec');
UPDATE ptc SET state = 'New Jersey' WHERE utility IN ('Atlantic City Electric', 'Public Service Electric & Gas (PSEG)', 'JCPL');

-- Create index on state column for better performance
CREATE INDEX IF NOT EXISTS idx_ptc_state ON ptc(state);

-- Set default state for any records that don't have one
UPDATE ptc SET state = 'Other' WHERE state IS NULL;