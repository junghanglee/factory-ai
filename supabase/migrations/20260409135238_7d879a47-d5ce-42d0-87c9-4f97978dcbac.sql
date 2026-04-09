
-- Video review requests (confirm videos)
CREATE TABLE public.video_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  room_id UUID NOT NULL,
  project_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews in their rooms" ON public.video_reviews
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = video_reviews.room_id 
    AND (chat_rooms.customer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Admins can manage reviews" ON public.video_reviews
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Video comments (timestamped feedback)
CREATE TABLE public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.video_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  timestamp_seconds NUMERIC NOT NULL DEFAULT 0,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their reviews" ON public.video_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM video_reviews vr
    JOIN chat_rooms cr ON cr.id = vr.room_id
    WHERE vr.id = video_comments.review_id
    AND (cr.customer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Authenticated users can add comments" ON public.video_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_video_reviews_updated_at
  BEFORE UPDATE ON public.video_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for video_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;
