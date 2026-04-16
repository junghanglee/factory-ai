
ALTER TABLE public.services ADD COLUMN price_usd numeric(10,2);
ALTER TABLE public.services ADD COLUMN original_price_usd numeric(10,2);
ALTER TABLE public.service_packages ADD COLUMN price_usd numeric(10,2);
