
-- 1. Add 'seller' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- 2. Create seller_profiles table
CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  bio text,
  profile_image text,
  phone text,
  bank_info text,
  commission_rate numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT '신청',
  total_sales integer NOT NULL DEFAULT 0,
  total_revenue integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for seller_profiles
CREATE POLICY "Seller profiles viewable by everyone"
  ON public.seller_profiles FOR SELECT
  USING (true);

CREATE POLICY "Sellers can update own profile"
  ON public.seller_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can apply as seller"
  ON public.seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all seller profiles"
  ON public.seller_profiles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Timestamp trigger for seller_profiles
CREATE TRIGGER update_seller_profiles_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Add seller_id to services (nullable so existing data stays intact)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL;

-- 7. RLS: sellers can manage their own services
CREATE POLICY "Sellers can insert own services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles
      WHERE id = services.seller_id
        AND user_id = auth.uid()
        AND status = '승인'
    )
  );

CREATE POLICY "Sellers can update own services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (
    seller_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles
      WHERE id = services.seller_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete own services"
  ON public.services FOR DELETE
  TO authenticated
  USING (
    seller_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.seller_profiles
      WHERE id = services.seller_id AND user_id = auth.uid()
    )
  );
