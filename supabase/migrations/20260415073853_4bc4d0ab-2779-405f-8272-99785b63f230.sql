-- Add payment_status and quote_details to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT '대기';

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS quote_details jsonb DEFAULT '{}'::jsonb;

-- Add index for payment_status filtering
CREATE INDEX IF NOT EXISTS idx_projects_payment_status ON public.projects(payment_status);