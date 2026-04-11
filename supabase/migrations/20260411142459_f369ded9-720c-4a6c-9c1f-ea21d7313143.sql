
-- Create service_reviews table for ratings/reviews
CREATE TABLE public.service_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  nickname TEXT NOT NULL DEFAULT '익명',
  image_url TEXT,
  is_admin_entry BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews
CREATE POLICY "Reviews are viewable by everyone"
ON public.service_reviews FOR SELECT
TO public
USING (true);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews"
ON public.service_reviews FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can create their own reviews
CREATE POLICY "Users can create reviews"
ON public.service_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND is_admin_entry = false);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.service_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND is_admin_entry = false);

-- Trigger for updated_at
CREATE TRIGGER update_service_reviews_updated_at
BEFORE UPDATE ON public.service_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookup by service
CREATE INDEX idx_service_reviews_service_id ON public.service_reviews(service_id);
