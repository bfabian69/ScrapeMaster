/*
  # Create PowerSetter table for energy rate data

  1. New Tables
    - `powersetter`
      - `id` (serial, primary key)
      - `zip_code` (text) - ZIP code for the energy rate
      - `price_per_kwh` (numeric) - Price per kilowatt hour in cents
      - `savings` (text) - Savings percentage or amount
      - `terms` (text) - Contract terms and duration
      - `info` (text) - Additional plan information
      - `green` (text) - Green energy status
      - `supplier_logo_url` (text) - URL to supplier logo
      - `signup_url` (text) - URL for plan signup
      - `utility` (text) - Utility company name
      - `fee` (text) - Any associated fees
      - `scraped_at` (timestamp) - When the data was scraped

  2. Security
    - Enable RLS on `powersetter` table
    - Add policies for authenticated users to read and insert data
*/

CREATE TABLE IF NOT EXISTS powersetter (
  id SERIAL PRIMARY KEY,
  zip_code TEXT,
  price_per_kwh NUMERIC(10, 4),
  savings TEXT,
  terms TEXT,
  info TEXT,
  green TEXT,
  supplier_logo_url TEXT,
  signup_url TEXT,
  utility TEXT,
  fee TEXT,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE powersetter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read powersetter data"
  ON powersetter
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert powersetter data"
  ON powersetter
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_powersetter_zip_code ON powersetter(zip_code);
CREATE INDEX IF NOT EXISTS idx_powersetter_scraped_at ON powersetter(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_powersetter_utility ON powersetter(utility);