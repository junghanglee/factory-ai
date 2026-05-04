
-- Fix 1: Remove public SELECT on chat-files bucket
DROP POLICY IF EXISTS "Anyone can view chat files" ON storage.objects;

-- Tighten authenticated read: only chat participants (customer, seller, or admin) where path starts with room_id
DROP POLICY IF EXISTS "Authenticated users can read chat files" ON storage.objects;
CREATE POLICY "Chat participants can read chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id::text = (storage.foldername(name))[1]
        AND (
          cr.customer_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = cr.seller_id AND sp.user_id = auth.uid())
        )
    )
  )
);

-- Fix 2: Restrict coupon SELECT (drop open policy). Redemption goes through SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "Authenticated users can view coupons for redemption" ON public.coupons;

-- Fix 3: Projects INSERT must verify ownership
DROP POLICY IF EXISTS "Customers can create projects for direct payment" ON public.projects;
CREATE POLICY "Customers can create projects for direct payment"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());
