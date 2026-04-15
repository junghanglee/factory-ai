
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS delivery_days_text text DEFAULT NULL;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS revisions_text text DEFAULT NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS delivery_days_text text DEFAULT NULL;
