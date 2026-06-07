-- SQL script to make email_address optional in bookings table.
-- Run this in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/tyqkssshywlzoglagbsh/sql/new)

ALTER TABLE public.bookings ALTER COLUMN email_address DROP NOT NULL;
