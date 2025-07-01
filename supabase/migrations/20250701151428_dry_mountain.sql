/*
  # Create ElectricityRates table for energy rate data

  1. New Tables
    - `electricityrates`
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
    - Enable RLS on `electricityrates` table
    - Add policies for anonymous and authenticated users to read and insert data
*/

CREATE TABLE IF NOT EXISTS electricityrates (
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

ALTER TABLE electricityrates ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read all electricityrates data (public energy rates)
CREATE POLICY "Anonymous users can read all electricityrates data"
  ON electricityrates
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read all electricityrates data
CREATE POLICY "Authenticated users can read all electricityrates data"
  ON electricityrates
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to insert electricityrates data (for scraping)
CREATE POLICY "Anonymous users can insert electricityrates data"
  ON electricityrates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert electricityrates data (for scraping)
CREATE POLICY "Authenticated users can insert electricityrates data"
  ON electricityrates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_electricityrates_zip_code ON electricityrates(zip_code);
CREATE INDEX IF NOT EXISTS idx_electricityrates_scraped_at ON electricityrates(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_electricityrates_utility ON electricityrates(utility);