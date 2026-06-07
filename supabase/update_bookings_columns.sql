-- SQL script to add driver and vehicle columns to the bookings table.
-- Run this in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/tyqkssshywlzoglagbsh/sql/new)

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS driver_phone TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_no TEXT;
