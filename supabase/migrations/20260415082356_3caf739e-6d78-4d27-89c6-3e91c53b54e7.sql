-- Fix SECURITY DEFINER view issue
DROP VIEW IF EXISTS public.seller_profiles_public;

CREATE VIEW public.seller_profiles_public
WITH (security_invoker = on) AS
SELECT id, business_name, bio, profile_image, status, total_sales, total_revenue, user_id
FROM public.seller_profiles
WHERE status = '승인';

GRANT SELECT ON public.seller_profiles_public TO anon, authenticated;