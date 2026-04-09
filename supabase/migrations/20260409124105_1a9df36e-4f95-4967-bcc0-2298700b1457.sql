
-- Chat rooms table
CREATE TABLE public.chat_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  admin_id uuid,
  title text NOT NULL DEFAULT '새 문의',
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  unread_customer integer NOT NULL DEFAULT 0,
  unread_admin integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text,
  message_type text NOT NULL DEFAULT 'text',
  file_url text,
  file_name text,
  file_type text,
  file_size integer,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_rooms_customer_id ON public.chat_rooms(customer_id);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Users can view their own chat rooms"
ON public.chat_rooms FOR SELECT TO authenticated
USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create chat rooms"
ON public.chat_rooms FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Participants can update chat rooms"
ON public.chat_rooms FOR UPDATE TO authenticated
USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));

-- Chat messages policies
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id
    AND (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can send messages in their rooms"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id
    AND (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Updated_at trigger
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- Storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Anyone can view chat files"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files');
