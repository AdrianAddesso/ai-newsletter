-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name USER-DEFINED NOT NULL UNIQUE,
  CONSTRAINT areas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  type USER-DEFINED NOT NULL,
  CONSTRAINT assets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.assets_block (
  block_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  CONSTRAINT assets_block_pkey PRIMARY KEY (block_id, asset_id),
  CONSTRAINT assets_block_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.block_content(id),
  CONSTRAINT assets_block_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id)
);
CREATE TABLE public.block_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text,
  display_order integer,
  must_fill boolean NOT NULL DEFAULT false,
  type USER-DEFINED NOT NULL,
  CONSTRAINT block_content_pkey PRIMARY KEY (id)
);
CREATE TABLE public.brand_kit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  font_id uuid,
  created_by_user_id uuid,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brand_kit_pkey PRIMARY KEY (id),
  CONSTRAINT brand_kit_font_id_fkey FOREIGN KEY (font_id) REFERENCES public.fonts(id),
  CONSTRAINT brand_kit_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.brandkit_assets (
  brand_kit_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  CONSTRAINT brandkit_assets_pkey PRIMARY KEY (brand_kit_id, asset_id),
  CONSTRAINT brandkit_assets_brand_kit_id_fkey FOREIGN KEY (brand_kit_id) REFERENCES public.brand_kit(id),
  CONSTRAINT brandkit_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id)
);
CREATE TABLE public.color_palette (
  brand_kit_id uuid NOT NULL,
  color_id uuid NOT NULL,
  CONSTRAINT color_palette_pkey PRIMARY KEY (brand_kit_id, color_id),
  CONSTRAINT color_palette_brand_kit_id_fkey FOREIGN KEY (brand_kit_id) REFERENCES public.brand_kit(id),
  CONSTRAINT color_palette_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id)
);
CREATE TABLE public.colors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hex text NOT NULL UNIQUE,
  CONSTRAINT colors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.commentary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  block_content_id uuid,
  commented_by_user_id uuid,
  show boolean NOT NULL DEFAULT true,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT commentary_pkey PRIMARY KEY (id),
  CONSTRAINT commentary_block_content_id_fkey FOREIGN KEY (block_content_id) REFERENCES public.block_content(id),
  CONSTRAINT commentary_commented_by_user_id_fkey FOREIGN KEY (commented_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.export_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT export_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  export_type_id uuid NOT NULL,
  CONSTRAINT exports_pkey PRIMARY KEY (id),
  CONSTRAINT exports_export_type_id_fkey FOREIGN KEY (export_type_id) REFERENCES public.export_types(id)
);
CREATE TABLE public.fonts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fonts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hyperlinks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  block_content_id uuid,
  url text NOT NULL,
  label text,
  CONSTRAINT hyperlinks_pkey PRIMARY KEY (id),
  CONSTRAINT hyperlinks_block_content_id_fkey FOREIGN KEY (block_content_id) REFERENCES public.block_content(id)
);
CREATE TABLE public.newsletter_blocks (
  newsletter_id uuid NOT NULL,
  block_content_id uuid NOT NULL,
  display_order integer,
  row integer,
  grid_column integer,
  CONSTRAINT newsletter_blocks_pkey PRIMARY KEY (newsletter_id, block_content_id),
  CONSTRAINT newsletter_blocks_newsletter_id_fkey FOREIGN KEY (newsletter_id) REFERENCES public.newsletters(id),
  CONSTRAINT newsletter_blocks_block_content_id_fkey FOREIGN KEY (block_content_id) REFERENCES public.block_content(id)
);
CREATE TABLE public.newsletter_exports (
  export_id uuid NOT NULL,
  newsletter_id uuid NOT NULL,
  url_file text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_exports_pkey PRIMARY KEY (export_id, newsletter_id),
  CONSTRAINT newsletter_exports_export_id_fkey FOREIGN KEY (export_id) REFERENCES public.exports(id),
  CONSTRAINT newsletter_exports_newsletter_id_fkey FOREIGN KEY (newsletter_id) REFERENCES public.newsletters(id)
);
CREATE TABLE public.newsletter_state_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  newsletter_id uuid NOT NULL,
  previous_state text,
  new_state text,
  reviewed_by_user_id uuid,
  all_commentaries text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_state_log_pkey PRIMARY KEY (id),
  CONSTRAINT newsletter_state_log_newsletter_id_fkey FOREIGN KEY (newsletter_id) REFERENCES public.newsletters(id),
  CONSTRAINT newsletter_state_log_reviewed_by_user_id_fkey FOREIGN KEY (reviewed_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.newsletters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  area_id uuid,
  theme_tag text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  publish_date timestamp with time zone,
  brand_kit_id uuid,
  template_id uuid,
  approved_by_user_id uuid,
  created_by_user_id uuid,
  state USER-DEFINED NOT NULL DEFAULT 'DRAFT'::newsletter_state,
  language USER-DEFINED NOT NULL DEFAULT 'SPA'::newsletter_language,
  format USER-DEFINED NOT NULL DEFAULT 'PORTRAIT'::newsletter_format,
  generation_content jsonb,
  CONSTRAINT newsletters_pkey PRIMARY KEY (id),
  CONSTRAINT newsletters_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id),
  CONSTRAINT newsletters_brand_kit_id_fkey FOREIGN KEY (brand_kit_id) REFERENCES public.brand_kit(id),
  CONSTRAINT newsletters_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id),
  CONSTRAINT newsletters_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id),
  CONSTRAINT newsletters_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.permission_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_]+$'::text),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT permission_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_]+$'::text),
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id),
  CONSTRAINT permissions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.permission_categories(id)
);
CREATE TABLE public.role_permissions (
  role public.user_role NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role, permission_id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.template_states (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT template_states_pkey PRIMARY KEY (id)
);
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  area_id uuid,
  layout JSON,
  orientation public.template_orientation NOT NULL,
  state_id uuid NOT NULL,
  prompt_base text,
  created_by_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT templates_pkey PRIMARY KEY (id),
  CONSTRAINT templates_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id),
  CONSTRAINT templates_state_id_fkey FOREIGN KEY (state_id) REFERENCES public.template_states(id),
  CONSTRAINT templates_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  area_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role public.user_role NOT NULL DEFAULT 'USER'::user_role,
  state public.user_state NOT NULL DEFAULT 'ACTIVE'::user_state,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id)
);
