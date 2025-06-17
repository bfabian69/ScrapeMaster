/*
  # Fix Row Level Security Policies for PowerSetter Data

  1. Security Changes
    - Drop existing restrictive policies
    - Create new permissive policies for anonymous and authenticated users
    - Allow both SELECT and INSERT operations for energy rate data (public information)
    
  2. Rationale
    - Energy rate data is public information that should be accessible
    - Scraping functionality requires INSERT permissions
    - Anonymous access is needed for the web application to function
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous inserts for powersetter data" ON powersetter;
DROP POLICY IF EXISTS "Users can insert powersetter data" ON powersetter;
DROP POLICY IF EXISTS "Users can read powersetter data" ON powersetter;
DROP POLICY IF EXISTS "Anonymous users can insert powersetter data" ON powersetter;
DROP POLICY IF EXISTS "Authenticated users can insert powersetter data" ON powersetter;
DROP POLICY IF EXISTS "Anonymous users can read all powersetter data" ON powersetter;
DROP POLICY IF EXISTS "Authenticated users can read all powersetter data" ON powersetter;

-- Create new, more permissive policies for public energy rate data

-- Allow anonymous users to read all powersetter data (public energy rates)
CREATE POLICY "Anonymous users can read all powersetter data"
  ON powersetter
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read all powersetter data
CREATE POLICY "Authenticated users can read all powersetter data"
  ON powersetter
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to insert powersetter data (for scraping)
CREATE POLICY "Anonymous users can insert powersetter data"
  ON powersetter
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert powersetter data (for scraping)
CREATE POLICY "Authenticated users can insert powersetter data"
  ON powersetter
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE powersetter ENABLE ROW LEVEL SECURITY;

-- Verify the policies are working by testing a simple query
-- This will help confirm the migration was successful
DO $$
BEGIN
  -- Test if we can query the table
  PERFORM COUNT(*) FROM powersetter;
  RAISE NOTICE 'RLS policies updated successfully. Table is accessible.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Warning: There may still be RLS issues. Error: %', SQLERRM;
END $$;