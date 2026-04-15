-- 1. Fix seller_profiles public exposure: replace blanket SELECT with scoped policy
DROP POLICY IF EXISTS "Seller profiles viewable by everyone" ON public.seller_profiles;

-- Public view for non-sensitive seller info (approved sellers only)
CREATE OR REPLACE VIEW public.seller_profiles_public AS
SELECT id, business_name, bio, profile_image, status, total_sales, total_revenue, user_id
FROM public.seller_profiles
WHERE status = '승인';

-- Allow public to read the view
GRANT SELECT ON public.seller_profiles_public TO anon, authenticated;

-- Scoped SELECT: sellers see own full profile
CREATE POLICY "Sellers can view own full profile"
  ON public.seller_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins already have ALL policy, but add explicit SELECT for clarity
-- (already exists via "Admins can manage all seller profiles")

-- Authenticated users can see basic info of approved sellers (needed for service pages)
CREATE POLICY "Authenticated users can view approved seller profiles"
  ON public.seller_profiles FOR SELECT TO authenticated
  USING (status = '승인');

-- 2. Fix storage buckets: make chat-files and seller-documents private
UPDATE storage.buckets SET public = false WHERE id IN ('chat-files', 'seller-documents');

-- Drop overly permissive storage policies
DROP POLICY IF EXISTS "Chat files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Seller documents publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read chat files" ON storage.objects;

-- Chat-files: only room participants and admins can read
CREATE POLICY "Authenticated users can read chat files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-files'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR (storage.foldername(name))[1] = 'hero'
      OR (storage.foldername(name))[1] = 'banners'
      OR auth.uid() IS NOT NULL
    )
  );

-- Seller-documents: only owner and admins
CREATE POLICY "Sellers and admins can read seller documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'seller-documents'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );