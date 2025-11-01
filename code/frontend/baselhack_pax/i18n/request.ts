import {getRequestConfig} from "next-intl/server";
import {locales, defaultLocale} from "./routing";

export default getRequestConfig(async ({locale}) => {
  if (!locales.includes(locale as any)) locale = defaultLocale;

  const messages = (await import(`../app/locales/${locale}.json`)).default;

  return {locale, messages};
});
