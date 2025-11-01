"use client";

import {Select} from "@mantine/core";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {locales, defaultLocale} from "@/i18n/routing";

export default function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();

  const parts = pathname.split("/").filter(Boolean);
  const current = locales.includes(parts[0] as any) ? parts[0] : defaultLocale;
  const rest = locales.includes(parts[0] as any) ? "/" + parts.slice(1).join("/") : pathname;
  const qs = searchParams?.toString();
  const query = qs ? `?${qs}` : "";

  return (
    <Select
      size="xs"
      w={120}
      value={current}
      data={locales.map((l) => ({value: l, label: l.toUpperCase()}))}
      onChange={(next) => {
        if (!next) return;
        router.push(`/${next}${rest}${query}`);
      }}
    />
  );
}
