
-- Create seller_notifications table
CREATE TABLE public.seller_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_notifications ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own notifications
CREATE POLICY "Sellers can view own notifications"
ON public.seller_notifications FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.seller_profiles
  WHERE seller_profiles.id = seller_notifications.seller_id
  AND seller_profiles.user_id = auth.uid()
));

-- Sellers can mark their notifications as read
CREATE POLICY "Sellers can update own notifications"
ON public.seller_notifications FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.seller_profiles
  WHERE seller_profiles.id = seller_notifications.seller_id
  AND seller_profiles.user_id = auth.uid()
));

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
ON public.seller_notifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_notifications;
