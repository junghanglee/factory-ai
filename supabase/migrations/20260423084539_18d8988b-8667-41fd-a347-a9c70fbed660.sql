-- Enable realtime for balance and transaction tables so MyPage updates instantly
ALTER TABLE public.user_balances REPLICA IDENTITY FULL;
ALTER TABLE public.cash_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.point_transactions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_balances;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.point_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END$$;