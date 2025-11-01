import {NextIntlClientProvider} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {locales} from '@/i18n/routing';

export function generateStaticParams() {
  return locales.map((l) => ({locale: l}));
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {children, params} = props;
  const {locale} = await params;

  setRequestLocale(locale);
  const messages = (await import(`@/app/locales/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
