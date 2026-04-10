
-- Table to store feedback field configurations per service or category
CREATE TABLE public.feedback_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'select',
  field_options text[] DEFAULT '{}'::text[],
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_fields_owner CHECK (
    (service_id IS NOT NULL AND category_id IS NULL) OR
    (service_id IS NULL AND category_id IS NOT NULL)
  )
);

ALTER TABLE public.feedback_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view feedback fields"
ON public.feedback_fields FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage feedback fields"
ON public.feedback_fields FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_feedback_fields_updated_at
BEFORE UPDATE ON public.feedback_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
