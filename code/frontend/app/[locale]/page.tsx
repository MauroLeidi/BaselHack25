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

export default function LocaleHomePage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();

  const [product, setProduct] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const API_BASE = "http://localhost:8000";

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
      console.log("OCR response:", ocrData);
      sessionStorage.setItem(
        "pax_form_prefill",
        JSON.stringify(ocrData.data ?? ocrData)
      );

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
      <Image
        src="/pax_logo.svg"
        alt="PAX"
        width={46}
        height={46}
        style={{ display: "block" }}
        priority
      />
      <Text size="lg" fw={700} c="pax" lh={1}>
        Admin
      </Text>
      </Link>

      <Container size="sm">
        <Stack align="center" gap="lg">
          <Image src="/pax_logo.svg" alt="PAX" width={120} height={40} priority />

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
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
}
