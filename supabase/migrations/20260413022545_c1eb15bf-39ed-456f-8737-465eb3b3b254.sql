
ALTER TABLE public.display_groups
ADD COLUMN font_size integer DEFAULT 26,
ADD COLUMN font_color text DEFAULT NULL,
ADD COLUMN highlight_color text DEFAULT NULL;

COMMENT ON COLUMN public.display_groups.font_size IS 'Title font size in px';
COMMENT ON COLUMN public.display_groups.font_color IS 'Title font color (hex)';
COMMENT ON COLUMN public.display_groups.highlight_color IS 'Highlight color for **wrapped** text in title';
