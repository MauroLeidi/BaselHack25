"use client";

import {
  Button,
  Container,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconChecklist, IconFileUpload } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function LocaleHomePage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const t = useTranslations("home");

  const [product, setProduct] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const API_BASE = "http://localhost:8000";

  function changeLocale(next: string) {
    router.push(`/${next}`);
  }

  function openPicker() {
    if (!product || uploading) return;
    fileRef.current?.click();
  }

  async function handleFileUpload(file: File | null) {
    if (!file || !product || uploading) return;

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("product", product);

      const res = await fetch(`${API_BASE}/process`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Upload failed:", err);
        alert(err?.error ?? "Upload failed");
        return;
      }

      const ocrData = await res.json();
      sessionStorage.setItem("pax_form_prefill", JSON.stringify(ocrData.data ?? ocrData));

      const qs = `?product=${encodeURIComponent(product)}`;
      router.push(`/${locale}/form${qs}`);
    } catch (e) {
      console.error("Upload/OCR error:", e);
      alert("Network error during upload");
    } finally {
      setUploading(false);
    }
  }

  function onNativeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.currentTarget.value = "";
    handleFileUpload(file);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        position: "relative",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(80rem 80rem at 20% -10%, rgba(94,68,255,0.06), transparent 50%), radial-gradient(80rem 80rem at 120% 120%, rgba(36,186,111,0.08), transparent 40%)",
      }}
    >
      <div style={{ position: "absolute", top: 12, left: 16, zIndex: 20, width: 140 }}>
        <Select
          value={locale}
          onChange={(v) => v && changeLocale(v)}
          data={[
            { value: "en", label: "English" },
            { value: "de", label: "Deutsch" },
            { value: "it", label: "Italiano" },
            { value: "fr", label: "Français" },
          ]}
          size="xs"
          radius="md"
        />
      </div>

      <Link
        href={`/${locale}/admin`}
        style={{
          position: "absolute",
          top: 12,
          right: 32,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
        }}
        aria-label="PAX Admin"
      >
        <Image src="/pax_logo.svg" alt="PAX" width={46} height={46} priority />
        <Text size="lg" fw={700} c="pax" lh={1}>
          Admin
        </Text>
      </Link>

      <Container
        style={{ width: "100%", maxWidth: 560, display: "flex", justifyContent: "center" }}
      >
        <Stack align="center" gap="lg" style={{ width: "100%" }}>
          <Image src="/pax_logo.svg" alt="PAX" width={120} height={40} priority />

          <Stack gap={4} align="center" style={{ width: "100%" }}>
            <Title order={2}>{t("title")}</Title>
            <Text c="dimmed" ta="center">
              {t("subtitle")}
            </Text>
          </Stack>

          <Paper
            shadow="sm"
            radius="lg"
            p="lg"
            withBorder
            style={{ width: "100%", maxWidth: 560 }}
          >
            <Stack gap="md">
              <Select
                label={t("select_product")}
                placeholder={t("choose_product")}
                value={product}
                onChange={setProduct}
                data={[
                  { value: "pillar-3a", label: "Pillar 3a" },
                  { value: "child-insurance", label: "Child insurance" },
                  { value: "accident-insurance", label: "Accident insurance" },
                ]}
                required
                disabled={uploading}
                styles={{
                  label: { whiteSpace: "nowrap" },
                }}
              />

              <Stack gap="sm">
                <Link
                  href={`/${locale}/form${product ? `?product=${encodeURIComponent(product)}` : ""}`}
                  style={{ width: "100%" }}
                  aria-disabled={!product || uploading}
                >
                  <Button
                    fullWidth
                    size="md"
                    radius="lg"
                    color="pax"
                    disabled={!product || uploading}
                    leftSection={<IconChecklist size={18} style={{ display: "block" }} />}
                    styles={{
                      root: { height: 48 },
                      inner: { justifyContent: "center", alignItems: "center", gap: 8 }, // center icon+text
                      section: { display: "inline-flex", alignItems: "center" },         // center the icon span
                      label: {
                        display: "inline-flex",      // was inline-block -> causes vertical offset
                        alignItems: "center",
                        lineHeight: 1,               // avoid extra vertical space
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      },
                    }}
                  >
                    {t("fill_form")}
                  </Button>
                </Link>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/*"
                  hidden
                  onChange={onNativeFileChange}
                />
                <Button
                  onClick={openPicker}
                  fullWidth
                  size="md"
                  radius="lg"
                  variant="light"
                  color="paxGreen"
                  leftSection={<IconFileUpload size={18} style={{ display: "block" }} />}
                  loading={uploading}
                  disabled={!product || uploading}
                  styles={{
                    root: { height: 48 },
                    inner: { justifyContent: "center", alignItems: "center", gap: 8 },
                    section: { display: "inline-flex", alignItems: "center" },
                    label: {
                      display: "inline-flex",
                      alignItems: "center",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                    },
                  }}
                >
                  {uploading ? t("reading") : t("upload")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
}
