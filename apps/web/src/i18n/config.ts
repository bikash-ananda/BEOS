export const supportedLocales = ["en", "ne"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "ne";
}
