-- Display Groups
CREATE TABLE public.display_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.display_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Display groups viewable by everyone" ON public.display_groups FOR SELECT USING (true);
CREATE POLICY "Temp allow all modifications on display_groups" ON public.display_groups FOR ALL USING (true) WITH CHECK (true);

-- Display Group Filters (sub-tabs)
CREATE TABLE public.display_group_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.display_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.display_group_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Display group filters viewable by everyone" ON public.display_group_filters FOR SELECT USING (true);
CREATE POLICY "Temp allow all modifications on display_group_filters" ON public.display_group_filters FOR ALL USING (true) WITH CHECK (true);

-- Display Group Services (linking services to groups/filters)
CREATE TABLE public.display_group_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.display_groups(id) ON DELETE CASCADE,
  filter_id uuid REFERENCES public.display_group_filters(id) ON DELETE SET NULL,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.display_group_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Display group services viewable by everyone" ON public.display_group_services FOR SELECT USING (true);
CREATE POLICY "Temp allow all modifications on display_group_services" ON public.display_group_services FOR ALL USING (true) WITH CHECK (true);

-- Seed test data: 2 display groups
INSERT INTO public.display_groups (id, title, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', '쇼핑몰 사장님이 많이 찾아요', 0),
  ('a1000000-0000-0000-0000-000000000002', '매장 운영할 때 많이 찾아요', 1);

-- Seed filters for group 1
INSERT INTO public.display_group_filters (id, group_id, name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'AI 이미지', 0),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'AI 영상', 1),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'AI 웹툰', 2),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'AI 광고', 3);

-- Seed filters for group 2
INSERT INTO public.display_group_filters (id, group_id, name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'AI 비서', 0),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'AI 음악', 1),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', '크레딧', 2);

-- Link existing services to groups (pick first 8 services)
DO $$
DECLARE
  svc RECORD;
  idx int := 0;
  filter_ids_g1 uuid[] := ARRAY['b1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000004']::uuid[];
  filter_ids_g2 uuid[] := ARRAY['b1000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000007']::uuid[];
BEGIN
  FOR svc IN SELECT id FROM public.services ORDER BY created_at LIMIT 8 LOOP
    IF idx < 4 THEN
      INSERT INTO public.display_group_services (group_id, filter_id, service_id, sort_order)
      VALUES ('a1000000-0000-0000-0000-000000000001', filter_ids_g1[(idx % 4) + 1], svc.id, idx);
    ELSE
      INSERT INTO public.display_group_services (group_id, filter_id, service_id, sort_order)
      VALUES ('a1000000-0000-0000-0000-000000000002', filter_ids_g2[((idx - 4) % 3) + 1], svc.id, idx - 4);
    END IF;
    idx := idx + 1;
  END LOOP;
END $$;