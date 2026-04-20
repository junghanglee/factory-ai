DROP POLICY IF EXISTS "Service role can manage refunds" ON public.refunds;

CREATE POLICY "Service role can manage refunds"
ON public.refunds
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);