-- Add Paddle-specific columns to payments table
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS paddle_transaction_id text,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text,
  ADD COLUMN IF NOT EXISTS paddle_customer_id text,
  ADD COLUMN IF NOT EXISTS paddle_checkout_id text,
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'paddle';

-- Add index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_payments_paddle_transaction_id 
  ON public.payments(paddle_transaction_id) 
  WHERE paddle_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_paddle_checkout_id 
  ON public.payments(paddle_checkout_id) 
  WHERE paddle_checkout_id IS NOT NULL;

-- Default currency switch to usd (Paddle doesn't support KRW)
ALTER TABLE public.payments ALTER COLUMN currency SET DEFAULT 'usd';