import templateClassicImage from '../assets/we_make_nestle/wmn-lockup-one-line-dark-oak-on-white.jpg'
import templateEditorialImage from '../assets/we_make_nestle/wmn-lockup-two-lines-dark-oak-on-white.jpg'
import templateBriefImage from '../assets/we_make_nestle/wmn-lockup-three-lines-dark-oak-on-white.jpg'
import type {
  AreaName,
  BrandKitId,
  NewsletterBlock,
  NewsletterTemplate,
  TemplateGenerationField,
} from '../types/newsletter'

export const areaLabels: Record<AreaName, string> = {
  COMUNICACION_INTERNA: 'Comunicacion interna',
  COMUNICACION_CORPORATIVA: 'Comunicacion corporativa',
}

export const brandKitLabels: Record<BrandKitId, string> = {
  'nestle-corporate': 'Nestle Corporate',
  nescafe: 'Nescafe',
  'kit-kat': 'KitKat',
}

export const generationFieldLabels: Record<TemplateGenerationField, string> = {
  relevantDates: 'Fecha CTA',
  cta: 'Texto CTA',
  contact: 'Contacto',
  linksOrSources: 'Link CTA',
  additionalContext: 'Contexto adicional',
}

const SHARED_OPTIONAL_FIELDS: TemplateGenerationField[] = [
  'relevantDates',
  'cta',
  'linksOrSources',
  'additionalContext',
]

export const templates: NewsletterTemplate[] = [
  {
    id: 'corporate-update',
    name: 'Actualizacion corporativa',
    imageUrl: templateClassicImage,
    area: 'COMUNICACION_INTERNA',
    brandKitId: 'nestle-corporate',
    requiredGenerationFields: [],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
  {
    id: 'people-story',
    name: 'Historia de equipos',
    imageUrl: templateEditorialImage,
    area: 'COMUNICACION_INTERNA',
    brandKitId: 'nescafe',
    requiredGenerationFields: ['contact'],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
  {
    id: 'weekly-brief',
    name: 'Resumen semanal',
    imageUrl: templateBriefImage,
    area: 'COMUNICACION_CORPORATIVA',
    brandKitId: 'nestle-corporate',
    requiredGenerationFields: [],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
  {
    id: 'leadership-note',
    name: 'Mensaje de liderazgo',
    imageUrl: templateClassicImage,
    area: 'COMUNICACION_CORPORATIVA',
    brandKitId: 'nescafe',
    requiredGenerationFields: ['contact'],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
  {
    id: 'culture-highlight',
    name: 'Cultura y reconocimiento',
    imageUrl: templateEditorialImage,
    area: 'COMUNICACION_CORPORATIVA',
    brandKitId: 'kit-kat',
    requiredGenerationFields: [],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
]

export const initialBlocks: NewsletterBlock[] = [
  {
    id: 'header',
    name: 'Encabezado',
    text: 'Noticias internas para estar cerca de lo importante.',
    backgroundColor: '#FFFFFF',
    comment: null,
  },
  {
    id: 'headline',
    name: 'Titulo principal',
    text: 'Avances, aprendizajes y proximos pasos del equipo.',
    backgroundColor: '#97CAEB',
    comment: null,
  },
  {
    id: 'body',
    name: 'Cuerpo',
    text: 'Compartimos novedades relevantes para que cada area pueda actuar con claridad.',
    backgroundColor: '#FFFFFF',
    comment: null,
  },
  {
    id: 'cta',
    name: 'Llamado a la accion',
    text: 'Conoce mas en el portal interno.',
    backgroundColor: '#FFC600',
    comment: null,
  },
]