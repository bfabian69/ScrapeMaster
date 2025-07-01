/*
  # Create PTC (Price to Compare) table

  1. New Tables
    - `ptc`
      - `id` (integer, primary key)
      - `utility` (text, utility company name)
      - `price_to_compare` (numeric, price in dollars per kWh)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ptc` table
    - Add policy for authenticated users to read PTC data
    - Add policy for authenticated users to insert PTC data

  3. Sample Data
    - Insert sample PTC data for common utilities
*/

CREATE TABLE IF NOT EXISTS ptc (
  id SERIAL PRIMARY KEY,
  utility TEXT NOT NULL,
  price_to_compare NUMERIC(10, 6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ptc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read PTC data"
  ON ptc
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anonymous reads for PTC data"
  ON ptc
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert PTC data"
  ON ptc
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ptc_utility ON ptc(utility);
CREATE INDEX IF NOT EXISTS idx_ptc_updated_at ON ptc(updated_at DESC);

-- Insert sample PTC data (prices in dollars per kWh, will be converted to cents in the app)
INSERT INTO ptc (utility, price_to_compare) VALUES
  ('ComEd', 0.1234),
  ('Ameren', 0.1156),
  ('Eversource - NSTAR', 0.1445),
  ('Eversource - WMECO', 0.1398),
  ('Ohio Edison', 0.1089),
  ('Duke Energy', 0.1167),
  ('AEP - Ohio Power', 0.1098),
  ('AEP Columbus', 0.1076),
  ('Toledo Edison', 0.1134),
  ('The Illuminating Company', 0.1123),
  ('PPL Electric', 0.1234),
  ('Met-Ed', 0.1198),
  ('PECO Energy', 0.1267),
  ('Penelec', 0.1189),
  ('Atlantic City Electric', 0.1345),
  ('Public Service Electric & Gas (PSEG)', 0.1289),
  ('JCPL', 0.1298),
  ('Nat Grid - MA', 0.1456)
ON CONFLICT DO NOTHING;