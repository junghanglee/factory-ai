
-- Drop blocking ALL policies and add temporary public write policies
-- These will be replaced with proper role-based policies after auth is implemented

-- services
DROP POLICY IF EXISTS "Only admins can modify services" ON public.services;
CREATE POLICY "Temp allow all modifications on services" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- service_packages
DROP POLICY IF EXISTS "Only admins can modify service packages" ON public.service_packages;
CREATE POLICY "Temp allow all modifications on service_packages" ON public.service_packages FOR ALL USING (true) WITH CHECK (true);

-- categories
DROP POLICY IF EXISTS "Only admins can modify categories" ON public.categories;
CREATE POLICY "Temp allow all modifications on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- banners
DROP POLICY IF EXISTS "Only admins can modify banners" ON public.banners;
CREATE POLICY "Temp allow all modifications on banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

-- portfolio_items
DROP POLICY IF EXISTS "Only admins can modify portfolio items" ON public.portfolio_items;
CREATE POLICY "Temp allow all modifications on portfolio_items" ON public.portfolio_items FOR ALL USING (true) WITH CHECK (true);

-- members
DROP POLICY IF EXISTS "Only admins can modify members" ON public.members;
CREATE POLICY "Temp allow all modifications on members" ON public.members FOR ALL USING (true) WITH CHECK (true);

-- projects
DROP POLICY IF EXISTS "Only admins can modify projects" ON public.projects;
CREATE POLICY "Temp allow all modifications on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

-- project_files
DROP POLICY IF EXISTS "Only admins can modify project files" ON public.project_files;
CREATE POLICY "Temp allow all modifications on project_files" ON public.project_files FOR ALL USING (true) WITH CHECK (true);
