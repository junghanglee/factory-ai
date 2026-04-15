
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT '승인';
