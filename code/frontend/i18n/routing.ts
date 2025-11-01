export const locales = ["en", "de", "fr", "it"] as const;
export type AppLocale = typeof locales[number];
export const defaultLocale: AppLocale = "en";
export const localePrefix = "always";
