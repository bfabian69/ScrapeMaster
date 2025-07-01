/*
  # Fix RLS policies for powersetter table

  1. Security Changes
    - Drop existing restrictive policies
    - Add new policies that allow anonymous and authenticated users to read data
    - Keep insert permissions for both anonymous and authenticated users
    - Ensure the policies are permissive and allow data access

  2. Policy Details
    - Allow anonymous users to SELECT all data (for public energy rate viewing)
    - Allow authenticated users to SELECT all data
    - Allow both anonymous and authenticated users to INSERT data (for scraping)
    - Remove overly restrictive conditions that might be blocking data access
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous inserts for powersetter data" ON powersetter;
DROP POLICY IF EXISTS "Users can insert powersetter data" ON powersetter;
DROP POLICY IF EXISTS "Users can read powersetter data" ON powersetter;

-- Create new, more permissive policies

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

-- Verify RLS is enabled
ALTER TABLE powersetter ENABLE ROW LEVEL SECURITY;