CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- ENUMS
-- =========================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'area_name') THEN
        CREATE TYPE public.area_name AS ENUM (
            'COMUNICACION_INTERNA',
            'COMUNICACION_CORPORATIVA'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
        CREATE TYPE public.asset_type AS ENUM (
            'IMAGE',
            'ICON',
            'LOGO',
            'SHAPE',
            'LOCKUP',
            'KEYWORD',
            'BLOCK'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'storage_object_source') THEN
        CREATE TYPE public.storage_object_source AS ENUM (
            'SYSTEM',
            'USER'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'block_content_type') THEN
        CREATE TYPE public.block_content_type AS ENUM (
            'LAYOUT',
            'BASE',
            'DIVIDER',
            'CONTENT',
            'MULTIMEDIA',
            'ICONS',
            'SPECIAL'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'newsletter_format') THEN
        CREATE TYPE public.newsletter_format AS ENUM (
            'PORTRAIT',
            'LANDSCAPE'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'newsletter_language') THEN
        CREATE TYPE public.newsletter_language AS ENUM (
            'SPA'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_orientation') THEN
        CREATE TYPE public.template_orientation AS ENUM (
            'PORTRAIT',
            'LANDSCAPE'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'newsletter_state') THEN
        CREATE TYPE public.newsletter_state AS ENUM (
            'DRAFT',
            'IN_REVIEW',
            'CHANGES_REQUESTED',
            'RESUBMITTED',
            'APPROVED',
            'DISCARDED'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'ADMIN',
            'FUNCTIONAL',
            'USER'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_state') THEN
        CREATE TYPE public.user_state AS ENUM (
            'ACTIVE',
            'INACTIVE',
            'REMOVED'
        );
    END IF;
END
$$;

-- =========================
-- BASE TABLES
-- =========================

CREATE TABLE public.areas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name public.area_name NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT areas_pkey PRIMARY KEY (id),
    CONSTRAINT areas_name_unique UNIQUE (name)
);

CREATE TABLE public.assets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    type public.asset_type NOT NULL,
    bucket text NOT NULL,
    object_key text NOT NULL,
    object_prefix text NOT NULL,
    file_name text NOT NULL,
    extension text,
    mime_type text,
    size_bytes bigint,
    checksum text,
    from_brand boolean NOT NULL DEFAULT false,
    source public.storage_object_source NOT NULL DEFAULT 'SYSTEM'::public.storage_object_source,
    created_by_user_id uuid,
    CONSTRAINT assets_pkey PRIMARY KEY (id)
);

CREATE TABLE public.block_content (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    block_type text NOT NULL,
    content text,
    display_order integer,
    must_fill boolean NOT NULL DEFAULT false,
    type public.block_content_type NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT block_content_pkey PRIMARY KEY (id)
);

CREATE TABLE public.colors (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    hex text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT colors_pkey PRIMARY KEY (id),
    CONSTRAINT colors_hex_key UNIQUE (hex)
);

CREATE TABLE public.export_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    CONSTRAINT export_types_pkey PRIMARY KEY (id),
    CONSTRAINT export_types_code_key UNIQUE (code)
);

CREATE TABLE public.font_groups (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT font_groups_pkey PRIMARY KEY (id),
    CONSTRAINT font_groups_name_key UNIQUE (name)
);

CREATE TABLE public.fonts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    font_group_id uuid NOT NULL,
    name text NOT NULL,
    style text NOT NULL,
    bucket text NOT NULL,
    object_key text NOT NULL,
    object_prefix text NOT NULL,
    file_name text NOT NULL,
    extension text,
    mime_type text,
    size_bytes bigint,
    checksum text,
    source public.storage_object_source NOT NULL DEFAULT 'SYSTEM'::public.storage_object_source,
    created_by_user_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT fonts_pkey PRIMARY KEY (id)
);

CREATE TABLE public.permission_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT permission_categories_pkey PRIMARY KEY (id),
    CONSTRAINT permission_categories_code_key UNIQUE (code),
    CONSTRAINT permission_categories_code_check CHECK (code ~ '^[A-Z0-9_]+$'::text)
);

CREATE TABLE public.template_states (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    CONSTRAINT template_states_pkey PRIMARY KEY (id),
    CONSTRAINT template_states_code_key UNIQUE (code)
);

CREATE TABLE public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    area_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    role public.user_role NOT NULL DEFAULT 'USER'::public.user_role,
    state public.user_state NOT NULL DEFAULT 'ACTIVE'::public.user_state,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE public.brand_kit (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    font_group_id uuid,
    created_by_user_id uuid,
    name text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT brand_kit_pkey PRIMARY KEY (id)
);

CREATE TABLE public.exports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    export_type_id uuid NOT NULL,
    CONSTRAINT exports_pkey PRIMARY KEY (id)
);

CREATE TABLE public.permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT permissions_pkey PRIMARY KEY (id),
    CONSTRAINT permissions_code_key UNIQUE (code),
    CONSTRAINT permissions_code_check CHECK (code ~ '^[A-Z0-9_]+$'::text)
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
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT templates_pkey PRIMARY KEY (id)
);

CREATE TABLE public.assets_block (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    block_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    field_key text NOT NULL,
    keyword_text text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT assets_block_pkey PRIMARY KEY (id)
);

CREATE TABLE public.brandkit_assets (
    brand_kit_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT brandkit_assets_pkey PRIMARY KEY (brand_kit_id, asset_id)
);

CREATE TABLE public.color_palette (
    brand_kit_id uuid NOT NULL,
    color_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT color_palette_pkey PRIMARY KEY (brand_kit_id, color_id)
);

CREATE TABLE public.commentary (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    block_content_id uuid,
    commented_by_user_id uuid,
    show boolean NOT NULL DEFAULT true,
    content text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT commentary_pkey PRIMARY KEY (id)
);

CREATE TABLE public.hyperlinks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    block_content_id uuid,
    url text NOT NULL,
    label text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT hyperlinks_pkey PRIMARY KEY (id)
);

CREATE TABLE public.newsletters (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    area_id uuid,
    theme_tag text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    publish_date timestamp with time zone,
    brand_kit_id uuid,
    template_id uuid,
    approved_by_user_id uuid,
    created_by_user_id uuid,
    state public.newsletter_state NOT NULL DEFAULT 'DRAFT'::public.newsletter_state,
    language public.newsletter_language NOT NULL DEFAULT 'SPA'::public.newsletter_language,
    format public.newsletter_format NOT NULL DEFAULT 'PORTRAIT'::public.newsletter_format,
    generation_content jsonb,
    CONSTRAINT newsletters_pkey PRIMARY KEY (id)
);

CREATE TABLE public.newsletter_blocks (
    newsletter_id uuid NOT NULL,
    block_content_id uuid NOT NULL,
    display_order integer,
    row integer,
    grid_column integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT newsletter_blocks_pkey PRIMARY KEY (newsletter_id, block_content_id)
);

CREATE TABLE public.newsletter_exports (
    export_id uuid NOT NULL,
    newsletter_id uuid NOT NULL,
    bucket text NOT NULL,
    object_key text NOT NULL,
    object_prefix text NOT NULL,
    file_name text NOT NULL,
    extension text,
    mime_type text,
    size_bytes bigint,
    checksum text,
    created_by_user_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT newsletter_exports_pkey PRIMARY KEY (export_id, newsletter_id)
);

CREATE TABLE public.newsletter_state_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    newsletter_id uuid NOT NULL,
    previous_state text,
    new_state text,
    reviewed_by_user_id uuid,
    all_commentaries text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT newsletter_state_log_pkey PRIMARY KEY (id)
);

CREATE TABLE public.role_permissions (
    role public.user_role NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT role_permissions_pkey PRIMARY KEY (role, permission_id)
);

-- =========================
-- FOREIGN KEYS
-- =========================

ALTER TABLE public.users
    ADD CONSTRAINT users_area_id_fkey
    FOREIGN KEY (area_id)
    REFERENCES public.areas(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.brand_kit
    ADD CONSTRAINT brand_kit_font_group_id_fkey
    FOREIGN KEY (font_group_id)
    REFERENCES public.font_groups(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.fonts
    ADD CONSTRAINT fonts_font_group_id_fkey
    FOREIGN KEY (font_group_id)
    REFERENCES public.font_groups(id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

ALTER TABLE public.brand_kit
    ADD CONSTRAINT brand_kit_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.assets
    ADD CONSTRAINT assets_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.exports
    ADD CONSTRAINT exports_export_type_id_fkey
    FOREIGN KEY (export_type_id)
    REFERENCES public.export_types(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.permissions
    ADD CONSTRAINT permissions_category_id_fkey
    FOREIGN KEY (category_id)
    REFERENCES public.permission_categories(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.templates
    ADD CONSTRAINT templates_area_id_fkey
    FOREIGN KEY (area_id)
    REFERENCES public.areas(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.templates
    ADD CONSTRAINT templates_state_id_fkey
    FOREIGN KEY (state_id)
    REFERENCES public.template_states(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.templates
    ADD CONSTRAINT templates_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.assets_block
    ADD CONSTRAINT assets_block_block_id_fkey
    FOREIGN KEY (block_id)
    REFERENCES public.block_content(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.assets_block
    ADD CONSTRAINT assets_block_asset_id_fkey
    FOREIGN KEY (asset_id)
    REFERENCES public.assets(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.brandkit_assets
    ADD CONSTRAINT brandkit_assets_brand_kit_id_fkey
    FOREIGN KEY (brand_kit_id)
    REFERENCES public.brand_kit(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.brandkit_assets
    ADD CONSTRAINT brandkit_assets_asset_id_fkey
    FOREIGN KEY (asset_id)
    REFERENCES public.assets(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.color_palette
    ADD CONSTRAINT color_palette_brand_kit_id_fkey
    FOREIGN KEY (brand_kit_id)
    REFERENCES public.brand_kit(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.color_palette
    ADD CONSTRAINT color_palette_color_id_fkey
    FOREIGN KEY (color_id)
    REFERENCES public.colors(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.commentary
    ADD CONSTRAINT commentary_block_content_id_fkey
    FOREIGN KEY (block_content_id)
    REFERENCES public.block_content(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.commentary
    ADD CONSTRAINT commentary_commented_by_user_id_fkey
    FOREIGN KEY (commented_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.hyperlinks
    ADD CONSTRAINT hyperlinks_block_content_id_fkey
    FOREIGN KEY (block_content_id)
    REFERENCES public.block_content(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_area_id_fkey
    FOREIGN KEY (area_id)
    REFERENCES public.areas(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_brand_kit_id_fkey
    FOREIGN KEY (brand_kit_id)
    REFERENCES public.brand_kit(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_template_id_fkey
    FOREIGN KEY (template_id)
    REFERENCES public.templates(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_approved_by_user_id_fkey
    FOREIGN KEY (approved_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletter_blocks
    ADD CONSTRAINT newsletter_blocks_newsletter_id_fkey
    FOREIGN KEY (newsletter_id)
    REFERENCES public.newsletters(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletter_blocks
    ADD CONSTRAINT newsletter_blocks_block_content_id_fkey
    FOREIGN KEY (block_content_id)
    REFERENCES public.block_content(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletter_exports
    ADD CONSTRAINT newsletter_exports_export_id_fkey
    FOREIGN KEY (export_id)
    REFERENCES public.exports(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletter_exports
    ADD CONSTRAINT newsletter_exports_newsletter_id_fkey
    FOREIGN KEY (newsletter_id)
    REFERENCES public.newsletters(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletter_exports
    ADD CONSTRAINT newsletter_exports_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.fonts
    ADD CONSTRAINT fonts_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.newsletter_state_log
    ADD CONSTRAINT newsletter_state_log_newsletter_id_fkey
    FOREIGN KEY (newsletter_id)
    REFERENCES public.newsletters(id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

ALTER TABLE public.newsletter_state_log
    ADD CONSTRAINT newsletter_state_log_reviewed_by_user_id_fkey
    FOREIGN KEY (reviewed_by_user_id)
    REFERENCES public.users(id)
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey
    FOREIGN KEY (permission_id)
    REFERENCES public.permissions(id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

-- =========================
-- INDEXES
-- =========================

CREATE INDEX assets_block_asset_id_idx
    ON public.assets_block(asset_id);

CREATE INDEX assets_block_block_id_idx
    ON public.assets_block(block_id);

CREATE UNIQUE INDEX assets_bucket_object_key_key
    ON public.assets(bucket, object_key);

CREATE INDEX assets_created_by_user_id_idx
    ON public.assets(created_by_user_id);

CREATE INDEX brandkit_assets_asset_id_idx
    ON public.brandkit_assets(asset_id);

CREATE INDEX brandkit_assets_brand_kit_id_idx
    ON public.brandkit_assets(brand_kit_id);

CREATE INDEX brand_kit_font_group_id_idx
    ON public.brand_kit(font_group_id);

CREATE INDEX color_palette_brand_kit_id_idx
    ON public.color_palette(brand_kit_id);

CREATE INDEX color_palette_color_id_idx
    ON public.color_palette(color_id);

CREATE INDEX commentary_block_content_id_idx
    ON public.commentary(block_content_id);

CREATE INDEX commentary_commented_by_user_id_idx
    ON public.commentary(commented_by_user_id);

CREATE INDEX exports_export_type_id_idx
    ON public.exports(export_type_id);

CREATE UNIQUE INDEX fonts_bucket_object_key_key
    ON public.fonts(bucket, object_key);

CREATE INDEX fonts_font_group_id_idx
    ON public.fonts(font_group_id);

CREATE INDEX fonts_created_by_user_id_idx
    ON public.fonts(created_by_user_id);

CREATE INDEX hyperlinks_block_content_id_idx
    ON public.hyperlinks(block_content_id);

CREATE INDEX newsletter_blocks_block_content_id_idx
    ON public.newsletter_blocks(block_content_id);

CREATE INDEX newsletter_blocks_newsletter_id_idx
    ON public.newsletter_blocks(newsletter_id);

CREATE INDEX newsletter_exports_export_id_idx
    ON public.newsletter_exports(export_id);

CREATE INDEX newsletter_exports_newsletter_id_idx
    ON public.newsletter_exports(newsletter_id);

CREATE UNIQUE INDEX newsletter_exports_bucket_object_key_key
    ON public.newsletter_exports(bucket, object_key);

CREATE INDEX newsletter_exports_created_by_user_id_idx
    ON public.newsletter_exports(created_by_user_id);

CREATE INDEX newsletter_state_log_newsletter_id_idx
    ON public.newsletter_state_log(newsletter_id);

CREATE INDEX newsletter_state_log_reviewed_by_user_id_idx
    ON public.newsletter_state_log(reviewed_by_user_id);

CREATE INDEX newsletters_approved_by_user_id_idx
    ON public.newsletters(approved_by_user_id);

CREATE INDEX newsletters_area_id_idx
    ON public.newsletters(area_id);

CREATE INDEX newsletters_brand_kit_id_idx
    ON public.newsletters(brand_kit_id);

CREATE INDEX newsletters_created_by_user_id_idx
    ON public.newsletters(created_by_user_id);

CREATE INDEX newsletters_template_id_idx
    ON public.newsletters(template_id);

CREATE INDEX templates_area_id_idx
    ON public.templates(area_id);

CREATE INDEX templates_created_by_user_id_idx
    ON public.templates(created_by_user_id);

CREATE INDEX templates_state_id_idx
    ON public.templates(state_id);

CREATE INDEX users_area_id_idx
    ON public.users(area_id);

CREATE INDEX idx_permissions_category_id
    ON public.permissions(category_id);

CREATE INDEX idx_role_permissions_permission_id
    ON public.role_permissions(permission_id);

CREATE INDEX idx_role_permissions_role
    ON public.role_permissions(role);

-- =========================
-- ROW LEVEL SECURITY
-- =========================
-- Staging/Supabase tiene RLS detectado por Prisma en estas tablas.
-- No se crean policies todavía; solo se replica el flag de RLS.

ALTER TABLE public.permission_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
