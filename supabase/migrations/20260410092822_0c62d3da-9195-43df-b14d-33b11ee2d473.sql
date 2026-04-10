
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS files text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS cost text,
  ADD COLUMN IF NOT EXISTS show_extra_info boolean NOT NULL DEFAULT false;

-- Create storage bucket for portfolio files
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-files', 'portfolio-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Portfolio files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-files');

CREATE POLICY "Admins can upload portfolio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio-files' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete portfolio files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio-files' AND public.has_role(auth.uid(), 'admin'::app_role));
