-- Enable realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_files;

-- Drop temp policies on project_files and add proper ones
DROP POLICY IF EXISTS "Project files are viewable by everyone" ON public.project_files;
DROP POLICY IF EXISTS "Temp allow all modifications on project_files" ON public.project_files;

CREATE POLICY "Users can view their project files"
ON public.project_files FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_files.project_id 
    AND (projects.customer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Admins can manage project files"
ON public.project_files FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop temp policies on projects and add proper ones
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Temp allow all modifications on projects" ON public.projects;

CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage projects"
ON public.projects FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow customers to update confirm_status on their projects
CREATE POLICY "Customers can confirm their projects"
ON public.projects FOR UPDATE TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());