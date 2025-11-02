"use client";

import { Select } from "@mantine/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { locales, defaultLocale, type AppLocale } from "@/i18n/routing";

// Desired dropdown order (labels: English, Français, Deutsch, Italiano)
const ORDER: AppLocale[] = ["en", "fr", "de", "it"];
const LABELS: Record<AppLocale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
};

export default function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();

  const parts = pathname.split("/").filter(Boolean);
  const hasLocale = locales.includes(parts[0] as AppLocale);
  const current = (hasLocale ? parts[0] : defaultLocale) as AppLocale;
  const rest = hasLocale ? `/${parts.slice(1).join("/")}` : pathname;
  const qs = searchParams?.toString();
  const query = qs ? `?${qs}` : "";

  const options = ORDER.filter(l => locales.includes(l)).map(l => ({
    value: l,
    label: LABELS[l],
  }));

  return (
    <Select
      size="xs"
      w={140}
      value={current}
      data={options}
      onChange={(next) => {
        if (!next) return;
        router.push(`/${next}${rest}${query}`);
      }}
      aria-label="Language"
    />
  );
}
