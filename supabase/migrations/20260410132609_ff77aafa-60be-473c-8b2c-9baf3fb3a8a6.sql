
-- Function to auto-assign admin with least members (round-robin by count)
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  least_busy_admin_id uuid;
BEGIN
  -- Only assign if not already assigned
  IF NEW.assigned_admin_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find the active admin with fewest assigned members
  SELECT ap.id INTO least_busy_admin_id
  FROM admin_profiles ap
  WHERE ap.active = true
  ORDER BY (
    SELECT COUNT(*) FROM members m WHERE m.assigned_admin_id = ap.id
  ) ASC, ap.created_at ASC
  LIMIT 1;

  IF least_busy_admin_id IS NOT NULL THEN
    NEW.assigned_admin_id := least_busy_admin_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on new member insert
CREATE TRIGGER trigger_auto_assign_admin
  BEFORE INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin();
