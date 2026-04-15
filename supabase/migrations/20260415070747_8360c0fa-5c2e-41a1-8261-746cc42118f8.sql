
-- Add settlement info fields to seller_profiles
ALTER TABLE public.seller_profiles
ADD COLUMN IF NOT EXISTS business_type text DEFAULT '개인',
ADD COLUMN IF NOT EXISTS business_number text,
ADD COLUMN IF NOT EXISTS business_owner text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_holder text;

-- Add withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT '신청',
  bank_name text,
  bank_account text,
  bank_holder text,
  admin_memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.seller_profiles
  WHERE seller_profiles.id = withdrawal_requests.seller_id
  AND seller_profiles.user_id = auth.uid()
));

CREATE POLICY "Sellers can create withdrawal requests"
ON public.withdrawal_requests FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.seller_profiles
  WHERE seller_profiles.id = withdrawal_requests.seller_id
  AND seller_profiles.user_id = auth.uid()
));

CREATE POLICY "Admins can manage withdrawal requests"
ON public.withdrawal_requests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
