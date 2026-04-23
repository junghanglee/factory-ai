
DROP POLICY IF EXISTS "Service role can manage balances" ON public.user_balances;
DROP POLICY IF EXISTS "Service role can manage cash transactions" ON public.cash_transactions;
DROP POLICY IF EXISTS "Service role can manage point transactions" ON public.point_transactions;
