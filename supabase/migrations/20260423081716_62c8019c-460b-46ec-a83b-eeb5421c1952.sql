-- Add additional contact/business fields to profiles for content trading
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS kakao_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_bank_name TEXT,
  ADD COLUMN IF NOT EXISTS refund_bank_account TEXT,
  ADD COLUMN IF NOT EXISTS refund_bank_holder TEXT;