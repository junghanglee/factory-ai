-- Allow authenticated customers to insert projects for direct payment
CREATE POLICY "Customers can create projects for direct payment"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (true);
