export const NewsletterFormat = {
    PORTRAIT: "PORTRAIT",
    LANDSCAPE: "LANDSCAPE",
} as const;

export type NewsletterFormat = (typeof NewsletterFormat)[keyof typeof NewsletterFormat];

export const NewsletterFormatLabel: Record<NewsletterFormat, string> = {
    [NewsletterFormat.PORTRAIT]: "Vertical",
    [NewsletterFormat.LANDSCAPE]: "Horizontal",
};
