-- SQL schema to create the bookings table and set up Row Level Security (RLS)
-- You can run this script directly in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/tyqkssshywlzoglagbsh/sql/new)

CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email_address TEXT NOT NULL,
  passengers_count INT NOT NULL,
  trip_instructions TEXT,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('One Way', 'Round Trip', 'Outstation Trip')),
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  number_of_days INT NOT NULL DEFAULT 1,
  car_type TEXT NOT NULL,
  distance_km NUMERIC NOT NULL,
  total_fare NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed'))
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow clean re-runs
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated reads" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated updates" ON public.bookings;

-- Allow anonymous inserts (for the booking form)
CREATE POLICY "Allow anonymous inserts" ON public.bookings
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated reads (for dashboard/admin users)
CREATE POLICY "Allow authenticated reads" ON public.bookings
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated updates (for dashboard/admin users to update status)
CREATE POLICY "Allow authenticated updates" ON public.bookings
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);


-- SQL schema to create the trip_sheets table and set up Row Level Security (RLS)
CREATE TABLE IF NOT EXISTS public.trip_sheets (
  booking_id TEXT PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  serial_no TEXT UNIQUE NOT NULL,
  organisation TEXT,
  ds_no TEXT,
  no_of_guests TEXT,
  booked_by TEXT,
  service_type TEXT,
  address TEXT,
  date_out DATE,
  date_in DATE,
  kms_out NUMERIC,
  kms_in NUMERIC,
  time_out TIME,
  time_in TIME,
  reporting_time TIME,
  chauffeur_name TEXT,
  chauffeur_phone TEXT,
  vehicle_start_time TIME,
  vehicle_no TEXT,
  car_allotted TEXT,
  parking_toll TEXT,
  standing_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trip_sheets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow clean re-runs
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.trip_sheets;

-- Allow authenticated users full control over trip sheets
CREATE POLICY "Allow authenticated full access" ON public.trip_sheets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

