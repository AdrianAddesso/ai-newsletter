import templateClassicImage from "../assets/we_make_nestle/wmn-lockup-one-line-dark-oak-on-white.jpg";
import templateEditorialImage from "../assets/we_make_nestle/wmn-lockup-two-lines-dark-oak-on-white.jpg";
import templateBriefImage from "../assets/we_make_nestle/wmn-lockup-three-lines-dark-oak-on-white.jpg";
import { AreaNameLabel } from "../../../packages/shared/src/enums/area-name.enum";
import type {
  AreaName,
  NewsletterBlock,
  TemplateGenerationField,
} from "../types/newsletter";

export const areaLabels: Record<AreaName, string> = AreaNameLabel;

export const generationFieldLabels: Record<TemplateGenerationField, string> = {
  relevantDates: "Fecha CTA",
  cta: "Texto CTA",
  contact: "Contacto",
  linksOrSources: "Link CTA",
  additionalContext: "Contexto adicional",
};

const SHARED_OPTIONAL_FIELDS: TemplateGenerationField[] = [
  "relevantDates",
  "cta",
  "linksOrSources",
  "additionalContext",
];

export const defaultOptionalGenerationFields = SHARED_OPTIONAL_FIELDS;

export function getTemplatePreviewImage(layout: string | null): string {
  switch (layout) {
    case "EDITORIAL":
      return templateEditorialImage;
    case "BRIEF":
      return templateBriefImage;
    case "CLASSIC":
    default:
      return templateClassicImage;
  }
}

export const initialBlocks: NewsletterBlock[] = [
  {
    id: "header",
    name: "Encabezado",
    text: "Noticias internas para estar cerca de lo importante.",
    backgroundColor: "#FFFFFF",
    comment: null,
  },
  {
    id: "headline",
    name: "Titulo principal",
    text: "Avances, aprendizajes y proximos pasos del equipo.",
    backgroundColor: "#97CAEB",
    comment: null,
  },
  {
    id: "body",
    name: "Cuerpo",
    text: "Compartimos novedades relevantes para que cada area pueda actuar con claridad.",
    backgroundColor: "#FFFFFF",
    comment: null,
  },
  {
    id: "cta",
    name: "Llamado a la accion",
    text: "Conoce mas en el portal interno.",
    backgroundColor: "#FFC600",
    comment: null,
  },
];
