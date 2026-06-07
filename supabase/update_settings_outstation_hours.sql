-- SQL migration to add outstationHoursPerDay to existing vehicle JSONB profiles in database
-- Run this in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/tyqkssshywlzoglagbsh/sql/new)

UPDATE public.settings
SET vehicles = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          vehicles,
          '{hatchback,outstationHoursPerDay}',
          '16'::jsonb
        ),
        '{sedan,outstationHoursPerDay}',
        '16'::jsonb
      ),
      '{premium_sedan,outstationHoursPerDay}',
      '16'::jsonb
    ),
    '{suv,outstationHoursPerDay}',
    '16'::jsonb
  ),
  '{premium_suv,outstationHoursPerDay}',
  '16'::jsonb
)
WHERE id = 'current';
