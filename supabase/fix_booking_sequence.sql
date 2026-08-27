-- Fix for repeating booking sequence numbers (all new bookings ending in -0045).
--
-- Root cause: the API derived the "next" sequence number from the local
-- bookings.json file (read-only / ephemeral on serverless) and from
-- SELECTing the bookings table (blocked by RLS for the anon key), so it
-- always fell back to the highest value baked into the repo file.
--
-- This script creates a real Postgres SEQUENCE plus a SECURITY DEFINER
-- function to read from it. Because the function runs as its owner it is
-- NOT affected by RLS, and nextval() is atomic so concurrent bookings can
-- never receive the same number.
--
-- Run this once in the Supabase Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/tyqkssshywlzoglagbsh/sql/new

-- 1. Dedicated sequence for booking numbers.
CREATE SEQUENCE IF NOT EXISTS public.booking_seq;

-- 2. Seed it from the highest sequence currently present in booking IDs.
--    setval(..., false) makes the next nextval() return exactly this value,
--    so an existing max of 44 -> next booking gets 45, and an empty table
--    -> next booking gets 1.
SELECT setval(
  'public.booking_seq',
  COALESCE(
    (
      SELECT MAX(substring(id from '([0-9]+)$')::integer)
      FROM public.bookings
      WHERE id ~ '-[0-9]+$'
    ),
    0
  ) + 1,
  false
);

-- 3. Function the API calls to reserve the next number.
CREATE OR REPLACE FUNCTION public.get_next_booking_sequence()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('public.booking_seq')::integer;
$$;

-- 4. Permissions.
GRANT EXECUTE ON FUNCTION public.get_next_booking_sequence() TO anon;
GRANT EXECUTE ON FUNCTION public.get_next_booking_sequence() TO authenticated;
GRANT USAGE ON SEQUENCE public.booking_seq TO anon;
GRANT USAGE ON SEQUENCE public.booking_seq TO authenticated;
