-- SQL script to create get_next_booking_sequence function to safely calculate booking sequences
-- Run this in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/tyqkssshywlzoglagbsh/sql/new)

CREATE OR REPLACE FUNCTION public.get_next_booking_sequence()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT lpad(
    (COALESCE(
      (
        SELECT MAX(substring(id from '\d{4}$')::integer)
        FROM public.bookings
        WHERE id ~ '^MYN-[A-Z]{3,4}-\d{6}-\d{4}-\d{4}$'
      ),
      0
    ) + 1)::text,
    4,
    '0'
  );
$$;

-- Grant execution permission to public/anon role
GRANT EXECUTE ON FUNCTION public.get_next_booking_sequence() TO anon;
GRANT EXECUTE ON FUNCTION public.get_next_booking_sequence() TO authenticated;
