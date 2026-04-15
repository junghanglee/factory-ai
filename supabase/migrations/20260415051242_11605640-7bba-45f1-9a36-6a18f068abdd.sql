
-- Add seller_id to projects
ALTER TABLE public.projects ADD COLUMN seller_id uuid REFERENCES public.seller_profiles(id);

-- Create settlements table
CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  order_amount integer NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 10,
  commission_amount integer NOT NULL DEFAULT 0,
  seller_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT '대기',
  settled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own settlements
CREATE POLICY "Sellers can view own settlements"
ON public.settlements FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.seller_profiles
  WHERE seller_profiles.id = settlements.seller_id
  AND seller_profiles.user_id = auth.uid()
));

-- Admins can manage all settlements
CREATE POLICY "Admins can manage settlements"
ON public.settlements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Sellers can view projects linked to them
CREATE POLICY "Sellers can view own projects"
ON public.projects FOR SELECT TO authenticated
USING (
  seller_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.seller_profiles
    WHERE seller_profiles.id = projects.seller_id
    AND seller_profiles.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_settlements_updated_at
BEFORE UPDATE ON public.settlements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
