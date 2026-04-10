
-- Add receive_assignments column
ALTER TABLE public.admin_profiles 
ADD COLUMN receive_assignments boolean NOT NULL DEFAULT true;

-- Update auto_assign_admin function to respect receive_assignments
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  least_busy_admin_id uuid;
BEGIN
  IF NEW.assigned_admin_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT ap.id INTO least_busy_admin_id
  FROM admin_profiles ap
  WHERE ap.active = true AND ap.receive_assignments = true
  ORDER BY (
    SELECT COUNT(*) FROM members m WHERE m.assigned_admin_id = ap.id
  ) ASC, ap.created_at ASC
  LIMIT 1;

  IF least_busy_admin_id IS NOT NULL THEN
    NEW.assigned_admin_id := least_busy_admin_id;
  END IF;

  RETURN NEW;
END;
$function$;
