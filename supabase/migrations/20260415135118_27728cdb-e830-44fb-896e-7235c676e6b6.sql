
-- Add English fields to categories
ALTER TABLE public.categories ADD COLUMN name_en text;
ALTER TABLE public.categories ADD COLUMN description_en text;

-- Add English fields to services
ALTER TABLE public.services ADD COLUMN title_en text;
ALTER TABLE public.services ADD COLUMN description_en text;
ALTER TABLE public.services ADD COLUMN detailed_description_en text;

-- Add English fields to service_packages
ALTER TABLE public.service_packages ADD COLUMN name_en text;
