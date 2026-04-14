-- Create trigger function to auto-increment unread counts
CREATE OR REPLACE FUNCTION public.increment_unread_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_sender_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.sender_id AND (role = 'admin' OR role = 'super_admin')
  ) INTO is_sender_admin;

  IF is_sender_admin THEN
    UPDATE public.chat_rooms
    SET unread_customer = unread_customer + 1
    WHERE id = NEW.room_id;
  ELSE
    UPDATE public.chat_rooms
    SET unread_admin = unread_admin + 1
    WHERE id = NEW.room_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_chat_message_increment_unread
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.increment_unread_on_message();
