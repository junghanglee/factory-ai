
CREATE TABLE public.feedback_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  request_text TEXT NOT NULL,
  response_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage feedback requests"
ON public.feedback_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can view feedback requests in their rooms
CREATE POLICY "Users can view feedback in their rooms"
ON public.feedback_requests
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_rooms
  WHERE chat_rooms.id = feedback_requests.room_id
  AND chat_rooms.customer_id = auth.uid()
));

-- Users can update (respond to) feedback requests in their rooms
CREATE POLICY "Users can respond to feedback"
ON public.feedback_requests
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_rooms
  WHERE chat_rooms.id = feedback_requests.room_id
  AND chat_rooms.customer_id = auth.uid()
));

CREATE TRIGGER update_feedback_requests_updated_at
BEFORE UPDATE ON public.feedback_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
