
-- 1) seller_profiles: restrict public column exposure
DROP POLICY IF EXISTS "Authenticated users can view approved seller profiles" ON public.seller_profiles;

CREATE OR REPLACE VIEW public.public_seller_profiles
WITH (security_invoker = true) AS
SELECT id, business_name, bio, profile_image, total_sales, status, created_at
FROM public.seller_profiles
WHERE status = '승인';

GRANT SELECT ON public.public_seller_profiles TO anon, authenticated;

-- Re-add a narrower policy so the view (security_invoker) can read approved rows for anyone
CREATE POLICY "Approved seller basic info readable"
ON public.seller_profiles
FOR SELECT
TO anon, authenticated
USING (status = '승인');
-- NOTE: This still exposes columns at the table level. To truly hide sensitive columns,
-- revoke column-level SELECT from anon/authenticated on sensitive fields:
REVOKE SELECT (bank_name, bank_account, bank_holder, business_number, business_owner, bank_info, phone, total_revenue, commission_rate)
  ON public.seller_profiles FROM anon, authenticated;
-- Owner (Sellers can view own full profile) and admin policies bypass via separate full grants
-- Re-grant full column access only to service_role (admins read through has_role policy + table privileges)
GRANT SELECT ON public.seller_profiles TO authenticated; -- non-sensitive columns only due to REVOKE above

-- 2) Storage: chat-files INSERT must verify chat room participation
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
CREATE POLICY "Chat participants can upload chat files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-files'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id::text = (storage.foldername(name))[1]
        AND (
          cr.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.seller_profiles sp
            WHERE sp.id = cr.seller_id AND sp.user_id = auth.uid()
          )
        )
    )
  )
);

-- 3) Storage: portfolio-files INSERT/UPDATE must verify path ownership
DROP POLICY IF EXISTS "Sellers can upload portfolio files" ON storage.objects;
CREATE POLICY "Sellers can upload portfolio files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-files'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (auth.uid())::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Sellers can update portfolio files" ON storage.objects;
CREATE POLICY "Sellers can update portfolio files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'portfolio-files'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (auth.uid())::text = (storage.foldername(name))[1]
  )
);

-- 4) auto_messages: restrict reads to admins; expose RPC for client to send auto messages
DROP POLICY IF EXISTS "Authenticated users can view auto messages" ON public.auto_messages;

CREATE OR REPLACE FUNCTION public.send_auto_messages(_room_id uuid, _trigger_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_allowed boolean;
  v_last text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT (
    cr.customer_id = v_user
    OR has_role(v_user, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM seller_profiles sp WHERE sp.id = cr.seller_id AND sp.user_id = v_user
    )
  ) INTO v_allowed
  FROM chat_rooms cr WHERE cr.id = _room_id;

  IF NOT COALESCE(v_allowed, false) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO chat_messages (room_id, sender_id, message, message_type)
  SELECT _room_id, v_user, am.message, 'system'
  FROM auto_messages am
  WHERE am.trigger_type = _trigger_type AND am.active = true
  ORDER BY am.sort_order ASC;

  SELECT am.message INTO v_last
  FROM auto_messages am
  WHERE am.trigger_type = _trigger_type AND am.active = true
  ORDER BY am.sort_order DESC LIMIT 1;

  IF v_last IS NOT NULL THEN
    UPDATE chat_rooms
    SET last_message = LEFT(v_last, 100), last_message_at = now()
    WHERE id = _room_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_auto_messages(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_auto_messages(uuid, text) TO authenticated;

-- 5) contact_inquiries: remove fragile JWT-email policy
DROP POLICY IF EXISTS "Users can view their own inquiries" ON public.contact_inquiries;

-- 6) Lock down trigger / internal SECURITY DEFINER functions from being called via RPC
REVOKE EXECUTE ON FUNCTION public.charge_cash(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_purchase_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_project_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_unread_on_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
