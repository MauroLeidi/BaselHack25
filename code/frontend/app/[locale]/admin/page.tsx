"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { notifications } from "@mantine/notifications";
import {
  ActionIcon,
  Container,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconChevronLeft } from "@tabler/icons-react";
import ConfirmModal from "@/app/components/admin/ConfirmModal";
import RulesFormCard from "@/app/components/admin/RulesFormCard";
import { useTranslations } from "next-intl";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
function toAbsoluteUrl(pathOrUrl: string) {
  try {
    new URL(pathOrUrl);
    return pathOrUrl; 
  } catch {}
  return new URL(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`, API_BASE).toString();
}

const MOCK_PLOTS =
  (process.env.NEXT_PUBLIC_PREVIEW_MOCKS?.split(",").map((s) => s.trim()).filter(Boolean)) ??
  ["/plots/rules_changes_overview.png"]; 

export default function AdminPage() {
  const { locale } = useParams() as { locale: string };
  const t = useTranslations("admin");
  const [product, setProduct] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [previewing, setPreviewing] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  async function handleSendConfirmed() {
    if (!product) {
      notifications.show({ title: "Missing product", message: "Select a product.", color: "orange" });
      return;
    }
    if (!file) {
      notifications.show({ title: "Missing file", message: "Choose a file.", color: "orange" });
      return;
    }
    if (sending) return;

    setConfirmOpen(false);

    try {
      setSending(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch(`${API_BASE}/admin/update_rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Upload failed");
      }

      const result = await res.json();

      notifications.show({
        title: "Rules updated",
        message: result.message ?? "Success",
        color: "green",
        autoClose: 5000,
      });

      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
        autoClose: 7000,
      });
    } finally {
      setSending(false);
    }
  }
async function handlePreview() {
  if (!product) {
    notifications.show({ title: "Missing product", message: "Select a product.", color: "orange" });
    return;
  }
  if (!file) {
    notifications.show({ title: "Missing file", message: "Choose a file.", color: "orange" });
    return;
  }
  if (previewing) return;

  setPreviewing(true);
  setPreviewUrls([]);

  setTimeout(() => {
    const urls = MOCK_PLOTS.map((p) => {
      const base = p.startsWith("/") ? p : `/${p}`;
      return `${base}${base.includes("?") ? "&" : "?"}t=${Date.now()}`;
    });
    setPreviewUrls(urls);
    setPreviewing(false);
    notifications.show({ title: "Preview ready", message: "Loaded plot(s).", color: "green" });
  }, 500);
}

  // Preview (multiple plots)
  /*async function handlePreview() {
    if (!product) {
      notifications.show({ title: "Missing product", message: "Select a product.", color: "orange" });
      return;
    }
    if (!file) {
      notifications.show({ title: "Missing file", message: "Choose a file.", color: "orange" });
      return;
    }
    if (previewing) return;

    try {
      setPreviewing(true);
      setPreviewUrls([]);

      const text = await file.text();
      const rules = JSON.parse(text);

      const res = await fetch(`${API_BASE}/admin/preview_rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, rules }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Preview failed");
      }

      const data = (await res.json()) as { path?: string; paths?: string[] };

      const paths = Array.isArray(data.paths) && data.paths.length > 0
        ? data.paths
        : data.path
          ? [data.path]
          : [];

      if (paths.length === 0) {
        throw new Error("No preview paths returned");
      }

      const urls = paths.map((p) => {
        const abs = toAbsoluteUrl(p);
        return `${abs}${abs.includes("?") ? "&" : "?"}t=${Date.now()}`;
      });

      setPreviewUrls(urls);
      notifications.show({ title: "Preview ready", message: "Plot(s) generated.", color: "green" });
    } catch (e: any) {
      notifications.show({
        title: "Preview error",
        message: e?.message ?? "Could not load preview image(s)",
        color: "red",
        autoClose: 7000,
      });
    } finally {
      setPreviewing(false);
    }
  }*/

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(80rem 80rem at 20% -10%, rgba(94,68,255,0.06), transparent 50%), radial-gradient(80rem 80rem at 120% 120%, rgba(36,186,111,0.08), transparent 40%)",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid var(--mantine-color-default-border)",
          background:
            "color-mix(in srgb, var(--mantine-color-body) 82%, transparent)",
          backdropFilter: "saturate(160%) blur(6px)",
        }}
      >
        <Container size="lg" py="sm">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Tooltip label="Back to start" withArrow>
                <ActionIcon
                  component={Link}
                  href={`/${locale}`}
                  variant="subtle"
                  radius="xl"
                  size="lg"
                  aria-label="Back"
                >
                  <IconChevronLeft size={18} />
                </ActionIcon>
              </Tooltip>

              <Image
                src="/pax_logo.svg"
                alt="PAX"
                width={90}
                height={28}
                priority
                style={{ objectFit: "contain", opacity: 0.9 }}
              />
            </Group>
            <div />
          </Group>
        </Container>
      </div>

      <Container size="lg" py="xl" style={{ flex: 1, width: "100%" }}>
        <Stack gap="lg">
          <div>
            <Title order={2} style={{ letterSpacing: "-0.01em" }}>
              {t("console_title")}
             </Title>
             <Text c="dimmed" mt={4}>
               {t("console_subtitle")}
            </Text>
          </div>

          <RulesFormCard
            product={product}
            setProduct={setProduct}
            file={file}
            setFile={setFile}
            sending={sending}
            onPreview={handlePreview}
            onUpdateRequest={() => {
              if (!product || !file) {
                notifications.show({
                  title: "Missing data",
                  message: "Select a product and choose a file.",
                  color: "orange",
                });
                return;
              }
              setConfirmOpen(true);
            }}
            previewing={previewing}
          />

          {(previewing || previewUrls.length > 0) && (
            <div style={{ marginTop: 8 }} aria-live="polite">
              <Text fw={700} style={{ marginBottom: 6 }}>Preview</Text>

              {previewing ? (
                <div
                  style={{
                    height: 240,
                    borderRadius: 12,
                    border: "1px dashed var(--mantine-color-default-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text c="dimmed">Generating…</Text>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    maxHeight: "70vh",
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {previewUrls.map((u, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={u + idx}
                      src={u}
                      alt={`Generated preview ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 12,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Stack>
      </Container>

      <ConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        product={product}
        fileName={file?.name}
        loading={sending}
        onConfirm={handleSendConfirmed}
      />
    </div>
  );
}
