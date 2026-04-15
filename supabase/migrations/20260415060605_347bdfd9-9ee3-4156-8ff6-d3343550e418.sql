
-- Add seller_id to chat_rooms
ALTER TABLE public.chat_rooms
ADD COLUMN seller_id uuid REFERENCES public.seller_profiles(id);

-- Drop and recreate chat_rooms SELECT policy to include sellers
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view their own chat rooms"
ON public.chat_rooms FOR SELECT TO authenticated
USING (
  auth.uid() = customer_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (seller_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM seller_profiles WHERE seller_profiles.id = chat_rooms.seller_id AND seller_profiles.user_id = auth.uid()
  ))
);

-- Drop and recreate chat_rooms UPDATE policy to include sellers
DROP POLICY IF EXISTS "Participants can update chat rooms" ON public.chat_rooms;
CREATE POLICY "Participants can update chat rooms"
ON public.chat_rooms FOR UPDATE TO authenticated
USING (
  auth.uid() = customer_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (seller_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM seller_profiles WHERE seller_profiles.id = chat_rooms.seller_id AND seller_profiles.user_id = auth.uid()
  ))
);

-- Drop and recreate chat_messages SELECT policy to include sellers
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND (
      chat_rooms.customer_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (chat_rooms.seller_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM seller_profiles WHERE seller_profiles.id = chat_rooms.seller_id AND seller_profiles.user_id = auth.uid()
      ))
    )
  )
);

-- Drop and recreate chat_messages INSERT policy to include sellers
DROP POLICY IF EXISTS "Users can send messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can send messages in their rooms"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND (
      chat_rooms.customer_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (chat_rooms.seller_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM seller_profiles WHERE seller_profiles.id = chat_rooms.seller_id AND seller_profiles.user_id = auth.uid()
      ))
    )
  )
);

-- Update unread increment trigger to handle seller messages
CREATE OR REPLACE FUNCTION public.increment_unread_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_sender_admin boolean;
  is_sender_seller boolean;
  room_seller_id uuid;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.sender_id AND (role = 'admin' OR role = 'super_admin')
  ) INTO is_sender_admin;

  -- Check if sender is the seller of this room
  SELECT cr.seller_id INTO room_seller_id
  FROM public.chat_rooms cr WHERE cr.id = NEW.room_id;

  SELECT EXISTS (
    SELECT 1 FROM public.seller_profiles
    WHERE id = room_seller_id AND user_id = NEW.sender_id
  ) INTO is_sender_seller;

  IF is_sender_admin OR is_sender_seller THEN
    -- Admin or seller message: increment customer unread
    UPDATE public.chat_rooms
    SET unread_customer = unread_customer + 1
    WHERE id = NEW.room_id;
  ELSE
    -- Customer message: increment admin unread
    UPDATE public.chat_rooms
    SET unread_admin = unread_admin + 1
    WHERE id = NEW.room_id;
  END IF;

  RETURN NEW;
END;
$function$;
