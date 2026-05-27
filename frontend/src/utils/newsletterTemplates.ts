import templateClassicImage from "../assets/we_make_nestle/wmn-lockup-one-line-dark-oak-on-white.jpg";
import templateEditorialImage from "../assets/we_make_nestle/wmn-lockup-two-lines-dark-oak-on-white.jpg";
import templateBriefImage from "../assets/we_make_nestle/wmn-lockup-three-lines-dark-oak-on-white.jpg";
import { AreaNameLabel } from "@shared/enums/area-name.enum";
import type {
  AreaName,
  TemplateGenerationField,
  TemplateLayoutBlock,
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

export function getTemplatePreviewImage(layout: TemplateLayoutBlock[] | string | null): string {
  const layoutName = typeof layout === "string" ? layout : null;

  switch (layoutName) {
    case "EDITORIAL":
      return templateEditorialImage;
    case "BRIEF":
      return templateBriefImage;
    case "CLASSIC":
    default:
      return templateClassicImage;
  }
}
