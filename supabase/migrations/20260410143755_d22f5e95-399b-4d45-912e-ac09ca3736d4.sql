
-- Update has_role to also check super_admin when checking admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'super_admin' AND _role = 'admin')
      )
  )
$$;

-- Grant super_admin role to the master admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('d48df3a3-dedc-48ae-9b30-d5c2f024638a', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
