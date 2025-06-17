/*
  # Add anonymous insert policy for powersetter table

  1. Security Changes
    - Add INSERT policy for anonymous users on `powersetter` table
    - This allows the scraping application to insert data using the anonymous key
    - Maintains existing SELECT policy for authenticated users

  2. Policy Details
    - Policy name: "Allow anonymous inserts for powersetter data"
    - Target: INSERT operations
    - Role: anon (anonymous users)
    - Condition: true (allows all inserts from anonymous users)
*/

-- Add policy to allow anonymous users to insert data into powersetter table
CREATE POLICY "Allow anonymous inserts for powersetter data"
  ON powersetter
  FOR INSERT
  TO anon
  WITH CHECK (true);