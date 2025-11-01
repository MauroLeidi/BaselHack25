"use client";

import Image from "next/image";
import {
  Button,
  Container,
  Stack,
  Title,
  Text,
  Group,
  Select,
  Paper,
  ThemeIcon,
} from "@mantine/core";
import { IconShieldCheck, IconFileUpload, IconChecklist } from "@tabler/icons-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function LocaleHomePage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();

  const [product, setProduct] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

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

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Upload failed:", err);
        alert(err?.error ?? "Upload failed");
        return;
      }

      // Expected OCR payload (example):
      // {
      //   firstName: "Jane",
      //   lastName: "Doe",
      //   smokes: true,
      //   cigarettes_per_day: 5,
      //   height_cm: 172,
      //   weight_kg: 64.5,
      //   date_of_birth: "05.06.1999",
      //   sports: ["Basketball", "Running"]
      // }
      const ocrData = await res.json();
      console.log("OCR response:", ocrData);

      sessionStorage.setItem("pax_form_prefill", JSON.stringify(ocrData));

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
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(80rem 80rem at 20% -10%, rgba(94,68,255,0.06), transparent 50%), radial-gradient(80rem 80rem at 120% 120%, rgba(36,186,111,0.08), transparent 40%)",
      }}
    >
      <Container size="sm">
        <Stack align="center" gap="lg">
          <Image src="/pax_logo.jpeg" alt="PAX" width={120} height={40} priority />

          <Stack gap={4} align="center">
            <Title order={2}>PAX Application</Title>
            <Text c="dimmed" ta="center">
              Choose how you want to submit your information
            </Text>
          </Stack>

          <Paper shadow="sm" radius="lg" p="lg" withBorder style={{ width: "100%", maxWidth: 560 }}>
            <Stack gap="md">
              <Select
                label="Select product"
                placeholder="Choose a product"
                value={product}
                onChange={setProduct}
                data={[
                  { value: "pillar-3a", label: "Pillar 3a" },
                  { value: "child-insurance", label: "Child insurance" },
                  { value: "accident-insurance", label: "Accident insurance" },
                ]}
                required
                disabled={uploading}
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
                    leftSection={<IconChecklist size={18} />}
                  >
                    Fill in the online form
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
                  leftSection={<IconFileUpload size={18} />}
                  loading={uploading}
                  disabled={!product || uploading}
                >
                  {uploading ? "Reading document…" : "Upload photo or PDF"}
                </Button>
              </Stack>

              <Group gap={8}>
                <ThemeIcon size="sm" radius="xl" color="paxGreen" variant="light">
                  <IconShieldCheck size={16} />
                </ThemeIcon>
                <div style={{ flex: 1 }} />
                <Link href={`/${locale}/admin`}>
                  <Text size="sm">Admin</Text>
                </Link>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
}
