export const NewsletterStatus = {
    DRAFT: "DRAFT",
    IN_REVIEW: "IN_REVIEW",
    CHANGES_REQUESTED: "CHANGES_REQUESTED",
    RESUBMITTED: "RESUBMITTED",
    APPROVED: "APPROVED",
    DISCARDED: "DISCARDED",
} as const;

export type NewsletterStatus =
    (typeof NewsletterStatus)[keyof typeof NewsletterStatus];

export const NewsletterStatusLabel: Record<NewsletterStatus, string> = {
    [NewsletterStatus.DRAFT]: "Borrador",
    [NewsletterStatus.IN_REVIEW]: "En Revisión",
    [NewsletterStatus.CHANGES_REQUESTED]: "Cambios Pedidos",
    [NewsletterStatus.RESUBMITTED]: "Reenviado",
    [NewsletterStatus.APPROVED]: "Aprobado",
    [NewsletterStatus.DISCARDED]: "Descartado",
};
