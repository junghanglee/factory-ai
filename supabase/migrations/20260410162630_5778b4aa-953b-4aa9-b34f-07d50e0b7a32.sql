
-- Add admin reply columns
ALTER TABLE public.contact_inquiries
ADD COLUMN admin_reply text DEFAULT NULL,
ADD COLUMN replied_at timestamp with time zone DEFAULT NULL;

-- Allow authenticated users to view their own inquiries by email
CREATE POLICY "Users can view their own inquiries"
ON public.contact_inquiries
FOR SELECT
TO authenticated
USING (email = (auth.jwt() ->> 'email'));
