
-- Enable RLS on realtime.messages and add default-deny + scoped allow policies
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own scoped channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write own scoped channels" ON realtime.messages;

-- Allow read on channels that are scoped to the user, an owned chat_room, or admins
CREATE POLICY "Authenticated can read own scoped channels"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE ('mypage-balance-' || auth.uid()::text || '%')
  OR EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE realtime.topic() = ('chat:' || cr.id::text)
      AND (
        cr.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = cr.seller_id AND sp.user_id = auth.uid())
      )
  )
);

CREATE POLICY "Authenticated can write own scoped channels"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR realtime.topic() = ('user:' || auth.uid()::text)
  OR EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE realtime.topic() = ('chat:' || cr.id::text)
      AND (
        cr.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = cr.seller_id AND sp.user_id = auth.uid())
      )
  )
);
