import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, localePrefix } from "./i18n/routing";

export default createMiddleware({ locales, defaultLocale, localePrefix });

export const config = {
  matcher: ["/", "/(en|de|fr|it)/:path*"]
};
