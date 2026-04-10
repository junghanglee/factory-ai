ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS detail_images text[] DEFAULT '{}'::text[];