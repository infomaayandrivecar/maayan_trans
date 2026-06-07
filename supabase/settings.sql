-- SQL schema to create the settings table and set up Row Level Security (RLS)
-- You can run this script directly in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/tyqkssshywlzoglagbsh/sql/new)

CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'current' CHECK (id = 'current'),
  company JSONB NOT NULL,
  vehicles JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow clean re-runs
DROP POLICY IF EXISTS "Allow read access to anyone" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.settings;
DROP POLICY IF EXISTS "Allow anon full access" ON public.settings;

-- Allow read access to anyone (anonymous and authenticated)
CREATE POLICY "Allow read access to anyone" ON public.settings
  FOR SELECT USING (true);

-- Allow authenticated users full control (insert, update, delete)
CREATE POLICY "Allow authenticated full access" ON public.settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon role full access (for server-side API routes using the anon key)
-- This is safe because the settings table has a single controlled row (id='current')
CREATE POLICY "Allow anon full access" ON public.settings
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- =============================================
-- SYNC: Upsert all current settings from settings.json
-- Run this in Supabase Dashboard SQL Editor to sync the DB with the app config.
-- =============================================
INSERT INTO public.settings (id, company, vehicles)
VALUES (
  'current',
  '{
    "phone": "+91 98942 21664",
    "email": "maayantransporters@gmail.com",
    "address": "11-E, RKK Nagar, Singanallur, Coimbatore, Tamil Nadu, India",
    "marqueeText": "✨ Welcome to Maayan Trans & Services! Premium Inter-City Travel, Airport Transfers, and Local Rides at Affordable Rates. ✨ | 📞 Call us at +91 98942 21664 to book your ride today! 📞 | ⭐ Safe, Vetted, and Professional Drivers for a Premium Experience. ⭐ ",
    "notificationEmails": [
      "info.maayandrivecar@gmail.com",
      "antoanstin@gmail.com"
    ],
    "gst": "29MAAYN1234F1Z5",
    "pan": "MAAYN12347",
    "minKmOneWay": 5,
    "minKmRoundTrip": 5,
    "minKmOutstation": 100
  }'::jsonb,
  '{
    "hatchback": {
      "ratePerKm": 13,
      "driverAllowancePerDay": 300,
      "oneWayMinKmPerHour": 20,
      "oneWayHourRate": 170,
      "roundTripHourRate": 170,
      "outstationHourRate": 170,
      "outstationMinKmPerDay": 250,
      "outstationHoursPerDay": 16
    },
    "sedan": {
      "ratePerKm": 14,
      "driverAllowancePerDay": 350,
      "oneWayMinKmPerHour": 20,
      "oneWayHourRate": 170,
      "roundTripHourRate": 170,
      "outstationHourRate": 180,
      "outstationMinKmPerDay": 250,
      "outstationHoursPerDay": 16
    },
    "premium_sedan": {
      "ratePerKm": 16,
      "driverAllowancePerDay": 400,
      "oneWayMinKmPerHour": 20,
      "oneWayHourRate": 170,
      "roundTripHourRate": 170,
      "outstationHourRate": 190,
      "outstationMinKmPerDay": 250,
      "outstationHoursPerDay": 16
    },
    "suv": {
      "ratePerKm": 17.5,
      "driverAllowancePerDay": 450,
      "oneWayMinKmPerHour": 20,
      "oneWayHourRate": 170,
      "roundTripHourRate": 170,
      "outstationHourRate": 200,
      "outstationMinKmPerDay": 250,
      "outstationHoursPerDay": 16
    },
    "premium_suv": {
      "ratePerKm": 20,
      "driverAllowancePerDay": 500,
      "oneWayMinKmPerHour": 20,
      "oneWayHourRate": 170,
      "roundTripHourRate": 170,
      "outstationHourRate": 210,
      "outstationMinKmPerDay": 250,
      "outstationHoursPerDay": 16
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  vehicles = EXCLUDED.vehicles,
  updated_at = timezone('utc'::text, now());
