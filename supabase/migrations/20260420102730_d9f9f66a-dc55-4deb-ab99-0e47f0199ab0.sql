-- Refund requests table for tracking Paddle refunds
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  requested_by UUID,
  paddle_adjustment_id TEXT UNIQUE,
  paddle_transaction_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT,
  admin_memo TEXT,
  refund_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'pending',
  paddle_status TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refunds_payment ON public.refunds(payment_id);
CREATE INDEX idx_refunds_project ON public.refunds(project_id);
CREATE INDEX idx_refunds_paddle_adj ON public.refunds(paddle_adjustment_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage refunds"
ON public.refunds FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own refunds"
ON public.refunds FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage refunds"
ON public.refunds FOR ALL
USING (auth.role() = 'service_role');

CREATE TRIGGER update_refunds_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add refund tracking columns to payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_status TEXT;