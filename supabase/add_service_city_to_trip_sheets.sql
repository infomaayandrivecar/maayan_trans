-- SQL script to add service_city column to trip_sheets table
ALTER TABLE public.trip_sheets ADD COLUMN IF NOT EXISTS service_city TEXT;
