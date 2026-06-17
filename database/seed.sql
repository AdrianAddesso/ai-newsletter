-- ========================================
-- FOUNDATIONAL SEED - RBAC + AREAS + USERS
-- + FONT GROUPS + BRAND KITS + TEMPLATE STATES + EXPORT TYPES
-- ========================================

-- ========================================
-- PERMISSION CATEGORIES
-- ========================================

INSERT INTO public.permission_categories (code, name) VALUES
('ACCESS_MANAGEMENT', 'Gestion de Accesos'),
('CONFIGURATION', 'Configuracion'),
('TEMPLATES', 'Plantillas'),
('CONTENT', 'Contenido'),
('REVIEW', 'Revision'),
('TRACEABILITY', 'Trazabilidad')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

-- ========================================
-- PERMISSIONS
-- ========================================

INSERT INTO public.permissions (category_id, code, description)
SELECT pc.id, v.code, v.description
FROM (
  VALUES
    ('ACCESS_MANAGEMENT', 'USER_MANAGE', 'Alta/Baja de usuarios'),
    ('ACCESS_MANAGEMENT', 'ROLE_ASSIGN', 'Asignacion de roles'),
    ('ACCESS_MANAGEMENT', 'SECURITY_POLICY_DEFINE', 'Definicion de politicas de seguridad y acceso'),

    ('CONFIGURATION', 'PROMPT_MANAGE', 'Backoffice y gestion de Prompts de IA'),
    ('CONFIGURATION', 'BRAND_MANAGE', 'Gestion de estilos de marca'),

    ('TEMPLATES', 'TEMPLATE_CREATE_RETIRE', 'Creacion y retiro de templates corporativos'),
    ('TEMPLATES', 'TEMPLATE_EDIT', 'Edicion de templates'),
    ('TEMPLATES', 'TEMPLATE_VIEW_COPY', 'Ver y copiar templates existentes'),

    ('CONTENT', 'CONTENT_GENERATE_AI', 'Generacion de contenido via IA'),
    ('CONTENT', 'CONTENT_UPLOAD', 'Carga de contenido y archivos'),
    ('CONTENT', 'CONTENT_EXPORT_APPROVED', 'Exportacion de contenidos aprobados'),

    ('REVIEW', 'REVIEW_REQUEST_PREVIEW', 'Solicitud de revision y previsualizacion'),
    ('REVIEW', 'REVIEW_COMMENT_CREATE', 'Crear comentarios de revision'),
    ('REVIEW', 'REVIEW_COMMENT_VIEW_REPLY', 'Ver y responder a comentarios de revision'),
    ('REVIEW', 'REVIEW_FINAL_APPROVE_COMMENT', 'Aprobacion final y comentarios'),

    ('TRACEABILITY', 'AUDIT_LOGS_METRICS_VIEW', 'Logs de auditoria y metricas de uso')
) AS v(category_code, code, description)
JOIN public.permission_categories pc
  ON pc.code = v.category_code
ON CONFLICT (code) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  description = EXCLUDED.description;

-- ========================================
-- ROLE PERMISSIONS
-- ========================================

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'ADMIN'::user_role, id
FROM public.permissions
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'FUNCTIONAL'::user_role, id
FROM public.permissions
WHERE code IN (
  'ROLE_ASSIGN',
  'TEMPLATE_VIEW_COPY',
  'TEMPLATE_EDIT',
  'CONTENT_UPLOAD',
  'TEMPLATE_CREATE_RETIRE',
  'CONTENT_EXPORT_APPROVED',
  'REVIEW_REQUEST_PREVIEW',
  'REVIEW_COMMENT_CREATE',
  'REVIEW_COMMENT_VIEW_REPLY',
  'REVIEW_FINAL_APPROVE_COMMENT',
  'AUDIT_LOGS_METRICS_VIEW'
)
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'USER'::user_role, id
FROM public.permissions
WHERE code IN (
  'CONTENT_GENERATE_AI',
  'CONTENT_UPLOAD',
  'CONTENT_EXPORT_APPROVED',
  'REVIEW_REQUEST_PREVIEW',
  'REVIEW_COMMENT_VIEW_REPLY',
  'TEMPLATE_VIEW_COPY'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- ========================================
-- AREAS
-- ========================================

INSERT INTO public.areas (name) VALUES
('COMUNICACION_INTERNA'::area_name),
('COMUNICACION_CORPORATIVA'::area_name)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- TEST USERS
-- ========================================

INSERT INTO public.users (
  id,
  name,
  last_name,
  email,
  area_id,
  role,
  state,
  refresh_token_version
)
SELECT
  COALESCE(v.id::uuid, gen_random_uuid()),
  v.name,
  v.last_name,
  v.email,
  a.id,
  v.role::user_role,
  'ACTIVE'::user_state,
  0::integer
FROM (
  VALUES
     ('ecbe7026-4405-4697-95de-20a855ebdcd0', 'Agus', 'Admin', 'rojas.agustint@gmail.com', 'COMUNICACION_INTERNA', 'ADMIN'),
    ('ecbe7026-4405-4697-95de-20a855ebdcd2', 'Lumen', 'Usuario', 'agustom2585@gmail.com', 'COMUNICACION_INTERNA', 'USER')
) AS v(id, name, last_name, email, area_name, role)
JOIN public.areas a
  ON a.name = v.area_name::area_name
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  last_name = EXCLUDED.last_name,
  area_id = EXCLUDED.area_id,
  role = EXCLUDED.role,
  state = EXCLUDED.state,
  refresh_token_version = 0;

-- ========================================
-- FONT GROUPS
-- ========================================

INSERT INTO public.font_groups (name)
VALUES
  ('Nestle'),
  ('Purina'),
  ('Kit Kat'),
  ('Maggi'),
  ('Nescafe'),
  ('Nescau'),
  ('Nespresso'),
  ('Milo'),
  ('Nido'),
  ('Perrier'),
  ('San Pellegrino'),
  ('Gerber'),
  ('Carnation'),
  ('Nestle Classic'),
  ('Nestle Health Science')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- EXPORT TYPES
-- ========================================

INSERT INTO public.export_types (code, name)
VALUES
  ('HTML', 'HTML'),
  ('PDF', 'PDF'),
  ('MJML', 'MJML')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

-- ========================================
-- TEMPLATE STATES
-- ========================================

INSERT INTO public.template_states (code, name)
VALUES
  ('DRAFT', 'Borrador'),
  ('ACTIVE', 'Activa'),
  ('RETIRED', 'Retirada')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

-- -- ========================================
-- -- TEMPLATES
-- -- ========================================

WITH desired_templates AS (
  SELECT
    v.name,
    v.description,
    a.id AS area_id,
    v.layout,
    v.orientation::public.template_orientation AS orientation,
    ts.id AS state_id,
    v.prompt_base,
    v.created_by_user_id,
    v.created_at
  FROM (
    VALUES
      (
        'ecard 5 CI 2026',
        'Recordatorio de fechas importantes',
        'COMUNICACION_INTERNA'::area_name,
        $json$[{"type":"headerFull","content":"{\"title\":\"\",\"subtitle\":\"\",\"leftLogoAsset\":\"\",\"rightLogoAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":0,"grid_column":0,"display_order":0,"mustFill":false},{"type":"labelLeftBackgroundFull","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"bgColor\":\"\",\"backgroundAsset\":\"\"}","row":1,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":2,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":4,"grid_column":0,"display_order":0,"mustFill":false},{"type":"iconLeftBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":5,"grid_column":0,"display_order":0,"mustFill":false},{"type":"iconLeftBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":6,"grid_column":0,"display_order":0,"mustFill":false},{"type":"iconLeftBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":7,"grid_column":0,"display_order":0,"mustFill":false},{"type":"labelLeftBackgroundFull","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"bgColor\":\"\",\"backgroundAsset\":\"\"}","row":8,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textDoubleCenterBackgroundFull","content":"{\"primaryText\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"secondaryText\":\"Consequuntur eum voluptas iure repellat voluptate, nisi ipsam explicabo fugit architecto sint adipisci.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":9,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":10,"grid_column":0,"display_order":0,"mustFill":false}]$json$::json,
        'PORTRAIT',
        'ACTIVE',
        NULL::text,
        'ecbe7026-4405-4697-95de-20a855ebdcd0'::uuid,
        '2026-06-01 21:12:58.914+00'::timestamptz
      ),
      (
        'ecard 2 CI 2026',
        'Recordatorio y desarrollo de recursos humano',
        'COMUNICACION_INTERNA'::area_name,
        $json$[{"type":"headerLeft","content":"{\"title\":\"\",\"subtitle\":\"\",\"logoAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":0,"grid_column":0,"display_order":0,"mustFill":false},{"type":"headerRight","content":"{\"title\":\"\",\"subtitle\":\"\",\"logoAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":0,"grid_column":1,"display_order":1,"mustFill":false},{"type":"labelLeftBackgroundFull","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"bgColor\":\"\",\"backgroundAsset\":\"\"}","row":1,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":2,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":2,"grid_column":1,"display_order":1,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":3,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":3,"grid_column":1,"display_order":1,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":3,"grid_column":2,"display_order":2,"mustFill":false},{"type":"iconCenterBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":3,"display_order":3,"mustFill":false},{"type":"iconCenterBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":4,"display_order":4,"mustFill":false},{"type":"iconCenterBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":5,"display_order":5,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":4,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":4,"grid_column":1,"display_order":1,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":4,"grid_column":2,"display_order":2,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":4,"grid_column":3,"display_order":3,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":4,"grid_column":4,"display_order":4,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":4,"grid_column":5,"display_order":5,"mustFill":false},{"type":"ctaFull","content":"{\"buttonLabel\":\"Click here\",\"href\":\"\",\"bgColor\":\"\"}","row":4,"grid_column":6,"display_order":6,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":4,"grid_column":7,"display_order":7,"mustFill":false}]$json$::json,
        'LANDSCAPE',
        'ACTIVE',
        NULL::text,
        'ecbe7026-4405-4697-95de-20a855ebdcd0'::uuid,
        '2026-06-01 21:03:22.511+00'::timestamptz
      ),
      (
        'ecard 3 CI 2026',
        'Ocasiones especiales',
        'COMUNICACION_INTERNA'::area_name,
        $json$[{"type":"headerFull","content":"{\"title\":\"\",\"subtitle\":\"\",\"leftLogoAsset\":\"\",\"rightLogoAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":0,"grid_column":0,"display_order":0,"mustFill":false},{"type":"labelLeftBackgroundSmall","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"bgColor\":\"\",\"backgroundAsset\":\"\"}","row":1,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":2,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":0,"display_order":0,"mustFill":false},{"type":"labelCenterBackgroundFull","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"bgColor\":\"\",\"backgroundAsset\":\"\"}","row":4,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":4,"grid_column":1,"display_order":1,"mustFill":false}]$json$::json,
        'PORTRAIT',
        'ACTIVE',
        NULL::text,
        'ecbe7026-4405-4697-95de-20a855ebdcd0'::uuid,
        '2026-06-01 21:05:34.497+00'::timestamptz
      ),
      (
        'Todos hacemos Nestlé',
        'Novedades de la semana',
        'COMUNICACION_CORPORATIVA'::area_name,
        $json$[{"type":"textDoubleCenterBackgroundFull","content":"{\"primaryText\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"secondaryText\":\"Consequuntur eum voluptas iure repellat voluptate, nisi ipsam explicabo fugit architecto sint adipisci.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":0,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLabelCenterBackgroundFull","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":0,"grid_column":1,"display_order":1,"mustFill":false},{"type":"iconLeftBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":1,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":2,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":2,"grid_column":1,"display_order":1,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":1,"display_order":1,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":4,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":4,"grid_column":1,"display_order":1,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":5,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":5,"grid_column":1,"display_order":1,"mustFill":false},{"type":"specialBoxBackgroundFull","content":"{\"title\":\"Lorem ipsum sit\",\"introText\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\",\"bodyText\":\"Provident blanditiis omnis natus ratione necessitatibus.\",\"closingText\":\"Consequuntur eum voluptas iure repellat voluptate nisi.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":6,"grid_column":0,"display_order":0,"mustFill":false},{"type":"iconLeftBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":7,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":8,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":8,"grid_column":1,"display_order":1,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":9,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":9,"grid_column":1,"display_order":1,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":10,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":10,"grid_column":1,"display_order":1,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":11,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":11,"grid_column":1,"display_order":1,"mustFill":false},{"type":"iconLeftBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":12,"grid_column":0,"display_order":0,"mustFill":false},{"type":"specialBoxBackgroundFull","content":"{\"title\":\"Lorem ipsum sit\",\"introText\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\",\"bodyText\":\"Provident blanditiis omnis natus ratione necessitatibus.\",\"closingText\":\"Consequuntur eum voluptas iure repellat voluptate nisi.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":13,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":14,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":14,"grid_column":1,"display_order":1,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":14,"grid_column":2,"display_order":2,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":14,"grid_column":3,"display_order":3,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":14,"grid_column":4,"display_order":4,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":14,"grid_column":5,"display_order":5,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":14,"grid_column":6,"display_order":6,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":14,"grid_column":7,"display_order":7,"mustFill":false},{"type":"textLabelCenterBackgroundFull","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":15,"grid_column":0,"display_order":0,"mustFill":false}]$json$::json,
        'LANDSCAPE',
        'ACTIVE',
        NULL::text,
        'ecbe7026-4405-4697-95de-20a855ebdcd0'::uuid,
        '2026-06-01 21:27:55.611+00'::timestamptz
      ),
      (
        'ecard 1 CL 2026',
        'Bienvenida y Novedades',
        'COMUNICACION_INTERNA'::area_name,
        $json$[{"type":"headerFull","content":"{\"title\":\"\",\"subtitle\":\"\",\"leftLogoAsset\":\"\",\"rightLogoAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":0,"grid_column":0,"display_order":0,"mustFill":false},{"type":"labelLeftBackgroundFull","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"bgColor\":\"\",\"backgroundAsset\":\"\"}","row":1,"grid_column":0,"display_order":0,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":1,"grid_column":1,"display_order":1,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":2,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":2,"grid_column":1,"display_order":1,"mustFill":false},{"type":"iconBoxBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet consectetur.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageBackgroundFull","content":"{\"backgroundAsset\":\"\",\"imageAsset\":\"\",\"altText\":\"Image\",\"overlayColor\":\"\"}","row":3,"grid_column":1,"display_order":1,"mustFill":false}]$json$::json,
        'LANDSCAPE',
        'ACTIVE',
        NULL::text,
        'ecbe7026-4405-4697-95de-20a855ebdcd0'::uuid,
        '2026-06-01 20:57:38.192+00'::timestamptz
      ),
      (
        'ecard 4 CI 2026',
        'Bienvenida',
        'COMUNICACION_INTERNA'::area_name,
        $json$[{"type":"headerFull","content":"{\"title\":\"\",\"subtitle\":\"\",\"leftLogoAsset\":\"\",\"rightLogoAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":0,"grid_column":0,"display_order":0,"mustFill":false},{"type":"labelLeftBackgroundSmall","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"bgColor\":\"\",\"backgroundAsset\":\"\"}","row":1,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":2,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":3,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textLeftBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":4,"grid_column":0,"display_order":0,"mustFill":false},{"type":"iconBoxBackgroundFull","content":"{\"iconName\":\"description\",\"label\":\"Lorem ipsum dolor sit amet consectetur.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":5,"grid_column":0,"display_order":0,"mustFill":false},{"type":"labelCenterBackgroundFull","content":"{\"label\":\"Lorem ipsum dolor sit amet\",\"bgColor\":\"\",\"backgroundAsset\":\"\"}","row":6,"grid_column":0,"display_order":0,"mustFill":false},{"type":"textCenterBackgroundFull","content":"{\"text\":\"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.\",\"bgColor\":\"\",\"backgroundAsset\":\"\",\"fontSize\":\"\",\"typographyStyle\":\"\",\"fontFamily\":\"\"}","row":7,"grid_column":0,"display_order":0,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":8,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":8,"grid_column":1,"display_order":1,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":8,"grid_column":2,"display_order":2,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":8,"grid_column":3,"display_order":3,"mustFill":false},{"type":"empty","content":"{\"bgColor\":\"\"}","row":8,"grid_column":4,"display_order":4,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":8,"grid_column":5,"display_order":5,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":9,"grid_column":0,"display_order":0,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":9,"grid_column":1,"display_order":1,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":9,"grid_column":2,"display_order":2,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":9,"grid_column":3,"display_order":3,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":9,"grid_column":4,"display_order":4,"mustFill":false},{"type":"imageFull","content":"{\"imageAsset\":\"\",\"altText\":\"Full image\"}","row":9,"grid_column":5,"display_order":5,"mustFill":false}]$json$::json,
        'LANDSCAPE',
        'ACTIVE',
        NULL::text,
        'ecbe7026-4405-4697-95de-20a855ebdcd0'::uuid,
        '2026-06-01 21:16:42.991+00'::timestamptz
      )
  ) AS v(
    name,
    description,
    area_name,
    layout,
    orientation,
    state_code,
    prompt_base,
    created_by_user_id,
    created_at
  )
  JOIN public.areas a
    ON a.name = v.area_name
  JOIN public.template_states ts
    ON ts.code = v.state_code
),
updated_templates AS (
  UPDATE public.templates t
  SET
    description = d.description,
    area_id = d.area_id,
    layout = d.layout,
    orientation = d.orientation,
    state_id = d.state_id,
    prompt_base = d.prompt_base,
    created_by_user_id = d.created_by_user_id,
    created_at = d.created_at
  FROM desired_templates d
  WHERE t.name = d.name
  RETURNING t.name
)
INSERT INTO public.templates (
  name,
  description,
  area_id,
  layout,
  orientation,
  state_id,
  prompt_base,
  created_by_user_id,
  created_at
)
SELECT
  d.name,
  d.description,
  d.area_id,
  d.layout,
  d.orientation,
  d.state_id,
  d.prompt_base,
  d.created_by_user_id,
  d.created_at
FROM desired_templates d
WHERE NOT EXISTS (
  SELECT 1
  FROM updated_templates ut
  WHERE ut.name = d.name
);

-- ========================================
-- BRAND KITS
-- ========================================

WITH desired_brand_kits AS (
  SELECT
    v.name,
    fg.id AS font_group_id
  FROM (
    VALUES
      ('Nestle'),
      ('Purina'),
      ('Kit Kat'),
      ('Maggi'),
      ('Nescafe'),
      ('Nescau'),
      ('Nespresso'),
      ('Milo'),
      ('Nido'),
      ('Perrier'),
      ('San Pellegrino'),
      ('Gerber'),
      ('Carnation'),
      ('Nestle Classic'),
      ('Nestle Health Science')
  ) AS v(name)
  LEFT JOIN public.font_groups fg
    ON fg.name = v.name
)
UPDATE public.brand_kit bk
SET
  font_group_id = d.font_group_id,
  active = true,
  deleted_at = NULL,
  updated_at = now()
FROM desired_brand_kits d
WHERE bk.name = d.name;

WITH desired_brand_kits AS (
  SELECT
    v.name,
    fg.id AS font_group_id
  FROM (
    VALUES
      ('Nestle'),
      ('Purina'),
      ('Kit Kat'),
      ('Maggi'),
      ('Nescafe'),
      ('Nescau'),
      ('Nespresso'),
      ('Milo'),
      ('Nido'),
      ('Perrier'),
      ('San Pellegrino'),
      ('Gerber'),
      ('Carnation'),
      ('Nestle Classic'),
      ('Nestle Health Science')
  ) AS v(name)
  LEFT JOIN public.font_groups fg
    ON fg.name = v.name
)
INSERT INTO public.brand_kit (name, font_group_id, active)
SELECT d.name, d.font_group_id, true
FROM desired_brand_kits d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.brand_kit bk
  WHERE bk.name = d.name
);


-- =========================================================
-- 1) INSERT GLOBAL COLORS
-- Paleta oficial We Make Nestlé
-- =========================================================

INSERT INTO colors (id, name, hex, created_at, updated_at, deleted_at)
VALUES
  (gen_random_uuid(), 'Nestle Red',       '#FF595A', NOW(), NOW(), NULL),
  (gen_random_uuid(), 'Dark Oak',         '#30261D', NOW(), NOW(), NULL),
  (gen_random_uuid(), 'White',            '#FFFFFF', NOW(), NOW(), NULL),

  (gen_random_uuid(), 'Blue Dark',        '#00A0DF', NOW(), NOW(), NULL),
  (gen_random_uuid(), 'Blue Light',       '#97CAEB', NOW(), NOW(), NULL),

  (gen_random_uuid(), 'Green Dark',       '#61A60E', NOW(), NOW(), NULL),
  (gen_random_uuid(), 'Green Light',      '#A2D45E', NOW(), NOW(), NULL),

  (gen_random_uuid(), 'Turquoise Dark',   '#00AFAA', NOW(), NOW(), NULL),
  (gen_random_uuid(), 'Turquoise Light',  '#99D9D9', NOW(), NOW(), NULL),

  (gen_random_uuid(), 'Purple Dark',      '#B14FC5', NOW(), NOW(), NULL),
  (gen_random_uuid(), 'Purple Light',     '#CB8BDA', NOW(), NOW(), NULL),

  (gen_random_uuid(), 'Orange',           '#FF8300', NOW(), NOW(), NULL),

  (gen_random_uuid(), 'Yellow Dark',      '#F5A800', NOW(), NOW(), NULL),
  (gen_random_uuid(), 'Yellow Light',     '#FFC600', NOW(), NOW(), NULL)
ON CONFLICT (hex) DO NOTHING;



-- =========================================================
-- 2) INSERT COLOR PALETTE POR BRAND KIT
-- Asigna 3 colores variados por brand kit.
-- No usa Red, Dark Oak ni White para brand kits.
-- =========================================================

INSERT INTO color_palette (brand_kit_id, color_id, created_at, deleted_at)
SELECT
  bk.id,
  c.id,
  NOW(),
  NULL
FROM (
  VALUES
    ('Nespresso',             'Blue Dark'),
    ('Nespresso',             'Turquoise Light'),
    ('Nespresso',             'Yellow Light'),

    ('Purina',                'Green Dark'),
    ('Purina',                'Blue Light'),
    ('Purina',                'Purple Light'),

    ('Maggi',                 'Yellow Light'),
    ('Maggi',                 'Green Light'),
    ('Maggi',                 'Turquoise Dark'),

    ('Nido',                  'Blue Light'),
    ('Nido',                  'Yellow Light'),
    ('Nido',                  'Orange'),

    ('Milo',                  'Green Dark'),
    ('Milo',                  'Green Light'),
    ('Milo',                  'Yellow Light'),

    ('Carnation',             'Purple Light'),
    ('Carnation',             'Blue Light'),
    ('Carnation',             'Orange'),

    ('San Pellegrino',        'Turquoise Dark'),
    ('San Pellegrino',        'Blue Light'),
    ('San Pellegrino',        'Green Light'),

    ('Nestle Classic',        'Purple Dark'),
    ('Nestle Classic',        'Yellow Light'),
    ('Nestle Classic',        'Turquoise Light'),

    ('Nescau',                'Orange'),
    ('Nescau',                'Blue Dark'),
    ('Nescau',                'Yellow Light'),

    ('Nestle Health Science', 'Green Light'),
    ('Nestle Health Science', 'Turquoise Light'),
    ('Nestle Health Science', 'Blue Dark'),

    ('Nestle',                'Blue Dark'),
    ('Nestle',                'Green Dark'),
    ('Nestle',                'Yellow Light'),

    ('Perrier',               'Turquoise Dark'),
    ('Perrier',               'Green Light'),
    ('Perrier',               'Yellow Light'),

    ('Kit Kat',               'Purple Dark'),
    ('Kit Kat',               'Orange'),
    ('Kit Kat',               'Blue Light'),

    ('Gerber',                'Yellow Light'),
    ('Gerber',                'Green Light'),
    ('Gerber',                'Purple Light'),

    ('Nescafe',               'Blue Dark'),
    ('Nescafe',               'Orange'),
    ('Nescafe',               'Turquoise Light')
) AS palette(brand_kit_name, color_name)
JOIN brand_kit bk
  ON bk.name = palette.brand_kit_name
JOIN colors c
  ON c.name = palette.color_name
WHERE bk.deleted_at IS NULL
  AND bk.active = TRUE
  AND c.deleted_at IS NULL
ON CONFLICT (brand_kit_id, color_id) DO NOTHING;

-- ========================================
-- AI CONFIG
-- ========================================

INSERT INTO public.ai_config (name, type, temperature, top_p, top_k, max_output_tokens)
VALUES
  ('Generacion de Contenido', 'CREATE',     0.5, 0.8, 20, 4000),
  ('Refinamiento de Texto',      'REGENERATE', 0.1, 0.8, 20, 4000)
ON CONFLICT (type) DO UPDATE
SET
  name              = EXCLUDED.name,
  temperature       = EXCLUDED.temperature,
  top_p             = EXCLUDED.top_p,
  top_k             = EXCLUDED.top_k,
  max_output_tokens = EXCLUDED.max_output_tokens,
  updated_at        = now();


-- ========================================
-- PROMPT COMMANDS
-- ========================================

DELETE FROM public.prompt_commands
WHERE type IN ('CREATE', 'REGENERATE');

INSERT INTO public.prompt_commands (name, type, display_order, instruction)
VALUES
  ('Contexto para refinamiento', 'REGENERATE', 0, 'Sos un editor de copias en espanol para boletines internos de Nestle. Mejoras textos para claridad, fluidez, tono, legibilidad y correccion, manteniendo el sentido original y el contexto corporativo.'),
  ('Regla de preservacion', 'REGENERATE', 1, 'Conserva la intencion original del texto. No inventes informacion nueva, no cambies fechas, nombres, cifras, hechos ni llamados a la accion si no estan explicitamente presentes en el texto original.'),
  ('Regla de salida', 'REGENERATE', 2, 'Devuelve unicamente el texto final mejorado en espanol. No devuelvas JSON, markdown, vinetas, titulos, comillas, comentarios ni explicaciones.'),
  ('Regla de estilo', 'REGENERATE', 3, 'Manten un tono corporativo interno, claro y natural. Evita frases genericas, exageradas o demasiado promocionales. Si el texto ya esta bien, solo haz mejoras minimas.'),
  ('Definicion de rol', 'CREATE', 1, 'Sos un redactor de copias en espanol para boletines internos de Nestle. Escribis contenido claro, profesional, empatico y alineado con la comunicacion corporativa interna.'),
  ('Instruccion de tarea', 'CREATE', 2, 'Debes generar contenido para todos los bloques presentes en templateBlocks usando unicamente el contexto estructurado proporcionado. Para cada bloque, completa todas las keys incluidas en fieldsToGenerate. No omitas bloques ni campos.'),
  ('Instruccion de formato de salida', 'CREATE', 3, 'Devuelve solo JSON valido con esta forma exacta: {"blocks":[{"blockId":"...","values":{"fieldKey":"generated value"}}]}. La respuesta debe incluir un elemento en "blocks" por cada bloque de templateBlocks.'),
  ('Ejemplo de esquema JSON', 'CREATE', 4, '{"blocks":[{"blockId":"headerFull-0-0-0-0","values":{"title":"El Mundial 2026 se acerca","subtitle":"Preparate para vivir la pasion del futbol con Nestle.","href":""}},{"blockId":"labelTextLabelCenterFull-1-0-0-1","values":{"topLabel":"Comunicado importante","bodyText":"Queremos compartir informacion clave con todo el equipo de forma clara y ordenada.","bottomLabel":"Gracias por acompanarnos en este proceso.","href":""}}]}'),
  ('Restricciones de formato', 'CREATE', 5, 'La respuesta debe contener exactamente un objeto raiz con la key "blocks". Cada elemento de "blocks" debe incluir exactamente "blockId" y "values". Dentro de "values", usa unicamente las keys presentes en fieldsToGenerate para ese bloque. No agregues campos extra. No uses esquemas legacy con "id", "name", "text" o "backgroundColor" como campos del bloque.'),
  ('Restriccion de material de origen', 'CREATE', 6, 'Usa el contexto estructurado proporcionado como unica fuente de verdad. No inventes estructura nueva. Si falta informacion especifica, escribe un fallback corporativo neutral en espanol, pero igualmente completa todas las keys requeridas para cada bloque.'),
  ('Regla de completitud por bloque', 'CREATE', 7, 'Debes devolver una entrada en "blocks" para cada bloque presente en templateBlocks. Para cada bloque, completa todas las keys incluidas en fieldsToGenerate. Si un bloque tiene multiples campos textuales, cada campo debe tener contenido propio y diferenciado.'),
  ('Regla para bloques con multiples textos', 'CREATE', 8, 'Si un bloque tiene varios campos textuales, cada campo debe tener contenido propio y diferenciado. Ejemplos: topLabel, bodyText y bottomLabel deben venir todos completos. primaryText y secondaryText deben ser distintos. title, introText, bodyText y closingText deben estar todos presentes. label debe completarse si es el texto visible del bloque. buttonLabel debe completarse en bloques CTA.'),
  ('Regla para iconos y CTA', 'CREATE', 9, 'En bloques de iconos, el campo visible principal suele ser "label", por lo que debes completarlo si aparece en fieldsToGenerate. El campo "iconName" no reemplaza al texto visible. En bloques CTA, debes completar siempre "buttonLabel" si aparece en fieldsToGenerate.'),
  ('Regla de idioma y tono', 'CREATE', 10, 'Todo el contenido debe estar en espanol. Manten un tono interno corporativo, claro y adecuado para comunicacion organizacional sensible cuando corresponda.');