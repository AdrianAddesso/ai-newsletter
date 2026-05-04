export const NewsletterLanguage = {
    SPA: "SPA",
} as const;

export type NewsletterLanguage = (typeof NewsletterLanguage)[keyof typeof NewsletterLanguage];

export const NewsletterLanguageLabel: Record<NewsletterLanguage, string> = {
    [NewsletterLanguage.SPA]: "Español",
};
