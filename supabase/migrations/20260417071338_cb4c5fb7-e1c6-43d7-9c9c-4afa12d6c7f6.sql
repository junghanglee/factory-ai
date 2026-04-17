ALTER TABLE public.display_groups ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE public.display_group_filters ADD COLUMN IF NOT EXISTS name_en text;