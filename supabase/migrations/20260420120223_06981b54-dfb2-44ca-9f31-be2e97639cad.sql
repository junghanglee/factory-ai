-- Remove duplicate service_packages, keep only the oldest per (service_id, name)
DELETE FROM public.service_packages sp
USING public.service_packages sp2
WHERE sp.service_id = sp2.service_id
  AND sp.name = sp2.name
  AND sp.created_at > sp2.created_at;

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.service_packages
  ADD CONSTRAINT service_packages_service_name_unique UNIQUE (service_id, name);