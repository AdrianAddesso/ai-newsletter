import type { UserRole } from '../contexts/AuthContext'
import type { TourDefinition, TourStep } from './types'

const allRoles: UserRole[] = ['ADMIN', 'FUNCTIONAL', 'USER']
const managementRoles: UserRole[] = ['ADMIN', 'FUNCTIONAL']

const navigationStep: TourStep = {
  selector: '[data-onboarding="navigation"]',
  title: 'Navegación principal',
  description: 'Desde aquí podés cambiar de sección, consultar la guía y cerrar sesión.',
  side: 'bottom',
}

export const tourRegistry: TourDefinition[] = [
  {
    id: 'newsletter-create',
    title: 'Crear un newsletter',
    pathPattern: /^\/newsletters\/create(?:\/[^/]+)?$/,
    roles: ['ADMIN', 'USER'],
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="creation-progress"]',
        title: 'Etapas de creación',
        description: 'Este indicador muestra en qué parte del flujo de creación estás.',
      },
      {
        selector: '[data-onboarding="template-selector"]',
        title: 'Diseño y marca',
        description: 'Elegí una plantilla y el brandkit que definirán la estructura y el estilo.',
        side: 'right',
      },
      {
        selector: '[data-onboarding="generation-form"]',
        title: 'Contenido para la IA',
        description: 'Completá el objetivo, la audiencia y los mensajes. Revisá los datos antes de generar.',
        side: 'left',
      },
    ],
  },
  {
    id: 'newsletter-edit',
    title: 'Editar un newsletter',
    pathPattern: /^\/newsletters\/edit\/[^/]+$/,
    roles: ['ADMIN', 'USER'],
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="newsletter-preview"]',
        title: 'Vista previa editable',
        description: 'Seleccioná un bloque para editar su contenido y comprobá el resultado en contexto.',
        side: 'right',
      },
      {
        selector: '[data-onboarding="newsletter-editor"]',
        title: 'Panel de edición',
        description: 'Modificá texto, imágenes y estilos; también podés regenerar contenido con IA.',
        side: 'left',
      },
      {
        selector: '[data-onboarding="editor-actions"]',
        title: 'Guardar o enviar',
        description: 'Guardá el borrador, enviá a revisión o descartá el newsletter según su estado.',
        side: 'top',
      },
    ],
  },
  {
    id: 'newsletter-export',
    title: 'Exportar y duplicar',
    pathPattern: /^\/newsletters\/export\/[^/]+$/,
    roles: managementRoles,
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="approved-preview"]',
        title: 'Newsletter aprobado',
        description: 'Revisá la versión final antes de descargarla o crear una copia.',
        side: 'right',
      },
      {
        selector: '[data-onboarding="export-actions"]',
        title: 'Opciones de exportación',
        description: 'Descargá el formato habilitado o duplicá el newsletter para reutilizarlo.',
        side: 'left',
      },
    ],
  },
  {
    id: 'template-library',
    title: 'Biblioteca de plantillas',
    pathPattern: /^\/templates\/library$/,
    roles: ['ADMIN', 'USER'],
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="template-library-filters"]',
        title: 'Encontrá una plantilla',
        description: 'Filtrá por orientación y área, o buscá una plantilla por nombre.',
      },
      {
        selector: '[data-onboarding="template-library-grid"]',
        title: 'Seleccioná el diseño',
        description: 'Previsualizá las opciones y elegí una para iniciar el newsletter.',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Gestionar newsletters',
    pathPattern: /^\/dashboard$/,
    roles: allRoles,
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="newsletter-toolbar"]',
        title: 'Buscar y crear',
        description: 'Usá los filtros, buscá por texto o iniciá un newsletter si tu rol lo permite.',
      },
      {
        selector: '[data-onboarding="newsletter-table"]',
        title: 'Listado y estados',
        description: 'Consultá el estado y usá las acciones disponibles para cada newsletter.',
      },
    ],
  },
  {
    id: 'review-detail',
    title: 'Revisar un newsletter',
    pathPattern: /^\/reviews\/[^/]+$/,
    roles: managementRoles,
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="newsletter-preview"]',
        title: 'Contenido en revisión',
        description: 'Seleccioná cada bloque para inspeccionarlo y asociarle comentarios.',
        side: 'right',
      },
      {
        selector: '[data-onboarding="review-controls"]',
        title: 'Decisión de revisión',
        description: 'Agregá observaciones y solicitá cambios, o aprobá el newsletter si está listo.',
        side: 'left',
      },
    ],
  },
  {
    id: 'reviews',
    title: 'Bandeja de revisiones',
    pathPattern: /^\/reviews$/,
    roles: managementRoles,
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="reviews-filters"]',
        title: 'Buscar revisiones',
        description: 'Filtrá y ordená los newsletters pendientes de análisis.',
      },
      {
        selector: '[data-onboarding="reviews-table"]',
        title: 'Abrir una revisión',
        description: 'Consultá autor, área y estado; luego abrí el detalle para decidir.',
      },
    ],
  },
  {
    id: 'template-create',
    title: 'Crear un template',
    pathPattern: /^\/templates\/create$/,
    roles: ['ADMIN'],
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="template-editor"]',
        title: 'Editor de template',
        description: 'Definí los datos generales y armá la estructura con bloques reutilizables.',
      },
      {
        selector: '[data-onboarding="block-picker"]',
        title: 'Selector de bloques',
        description: 'Elegí bloques compatibles y agregalos a la estructura del template.',
      },
    ],
  },
  {
    id: 'template-edit',
    title: 'Editar un template',
    pathPattern: /^\/templates\/edit\/[^/]+$/,
    roles: managementRoles,
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="template-editor"]',
        title: 'Configuración del template',
        description: 'Actualizá los datos y la estructura. Revisá la vista previa antes de guardar.',
      },
      {
        selector: '[data-onboarding="block-picker"]',
        title: 'Bloques disponibles',
        description: 'Agregá únicamente los bloques necesarios para mantener una estructura clara.',
      },
    ],
  },
  {
    id: 'templates',
    title: 'Administrar templates',
    pathPattern: /^\/templates$/,
    roles: managementRoles,
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="templates-toolbar"]',
        title: 'Buscar y crear templates',
        description: 'Buscá templates existentes. Sólo administración puede crear uno nuevo.',
      },
      {
        selector: '[data-onboarding="templates-table"]',
        title: 'Acciones del template',
        description: 'Previsualizá, editá o eliminá según los permisos de tu rol.',
      },
    ],
  },
  {
    id: 'users',
    title: 'Administrar usuarios',
    pathPattern: /^\/admin\/users$/,
    roles: ['ADMIN'],
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="users-toolbar"]',
        title: 'Alta y exportación',
        description: 'Creá usuarios, exportá el listado o buscá una persona existente.',
      },
      {
        selector: '[data-onboarding="users-table"]',
        title: 'Roles y estados',
        description: 'Revisá la información y usá las acciones para editar o eliminar usuarios.',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analítica e historial',
    pathPattern: /^\/analytics$/,
    roles: managementRoles,
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="analytics-summary"]',
        title: 'Resumen de actividad',
        description: 'Consultá las métricas y el historial de cambios de estado.',
      },
      {
        selector: '[data-onboarding="analytics-table"]',
        title: 'Trazabilidad',
        description: 'Seleccioná un newsletter y revisá sus transiciones y comentarios.',
      },
    ],
  },
  {
    id: 'brandkit',
    title: 'Configurar un brandkit',
    pathPattern: /^\/admin\/brandkit$/,
    roles: ['ADMIN'],
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="brandkit-header"]',
        title: 'Información del brandkit',
        description: 'Definí el nombre y estado antes de administrar sus recursos.',
      },
      {
        selector: '[data-onboarding="brandkit-resources"]',
        title: 'Recursos de marca',
        description: 'Administrá fuentes, colores y assets que estarán disponibles en newsletters.',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Panel administrativo',
    pathPattern: /^\/admin$/,
    roles: ['ADMIN'],
    steps: [
      navigationStep,
      {
        selector: '[data-onboarding="admin-tabs"]',
        title: 'Áreas de configuración',
        description: 'Cambiá entre configuración de IA, materiales y branding.',
      },
      {
        selector: '[data-onboarding="admin-content"]',
        title: 'Gestión administrativa',
        description: 'Cada pestaña permite crear, editar o eliminar recursos de la plataforma.',
      },
    ],
  },
]

export function findTour(pathname: string, role: UserRole): TourDefinition | null {
  return tourRegistry.find(
    (tour) => tour.pathPattern.test(pathname) && tour.roles.includes(role),
  ) ?? null
}
