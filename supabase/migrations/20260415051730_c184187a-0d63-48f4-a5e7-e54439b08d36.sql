
-- ============ banners ============
DROP POLICY IF EXISTS "Temp allow all modifications on banners" ON public.banners;
CREATE POLICY "Admins can manage banners"
ON public.banners FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ categories ============
DROP POLICY IF EXISTS "Temp allow all modifications on categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ members ============
DROP POLICY IF EXISTS "Temp allow all modifications on members" ON public.members;
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.members;
CREATE POLICY "Admins can view all members"
ON public.members FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage members"
ON public.members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ portfolio_items ============
DROP POLICY IF EXISTS "Temp allow all modifications on portfolio_items" ON public.portfolio_items;
CREATE POLICY "Admins can manage portfolio items"
ON public.portfolio_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ services ============
DROP POLICY IF EXISTS "Temp allow all modifications on services" ON public.services;
CREATE POLICY "Admins can manage all services"
ON public.services FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ service_packages ============
DROP POLICY IF EXISTS "Temp allow all modifications on service_packages" ON public.service_packages;
CREATE POLICY "Admins can manage all packages"
ON public.service_packages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Sellers can manage packages for their own services
CREATE POLICY "Sellers can insert own service packages"
ON public.service_packages FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.services s
  JOIN public.seller_profiles sp ON sp.id = s.seller_id
  WHERE s.id = service_packages.service_id
  AND sp.user_id = auth.uid()
));

CREATE POLICY "Sellers can update own service packages"
ON public.service_packages FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.services s
  JOIN public.seller_profiles sp ON sp.id = s.seller_id
  WHERE s.id = service_packages.service_id
  AND sp.user_id = auth.uid()
));

CREATE POLICY "Sellers can delete own service packages"
ON public.service_packages FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.services s
  JOIN public.seller_profiles sp ON sp.id = s.seller_id
  WHERE s.id = service_packages.service_id
  AND sp.user_id = auth.uid()
));

-- ============ display_groups ============
DROP POLICY IF EXISTS "Temp allow all modifications on display_groups" ON public.display_groups;
CREATE POLICY "Admins can manage display groups"
ON public.display_groups FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ display_group_filters ============
DROP POLICY IF EXISTS "Temp allow all modifications on display_group_filters" ON public.display_group_filters;
CREATE POLICY "Admins can manage display group filters"
ON public.display_group_filters FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ display_group_services ============
DROP POLICY IF EXISTS "Temp allow all modifications on display_group_services" ON public.display_group_services;
CREATE POLICY "Admins can manage display group services"
ON public.display_group_services FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
