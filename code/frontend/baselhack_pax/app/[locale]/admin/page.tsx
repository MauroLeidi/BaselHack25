"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ActionIcon,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconChevronLeft, IconSend, IconSettings2 } from "@tabler/icons-react";

const PRODUCT_LABELS: Record<string, string> = {
  "pillar-3a": "Pillar 3a",
  "child-insurance": "Child insurance",
  "accident-insurance": "Accident insurance",
};

const PRODUCT_OPTIONS = [
  { value: "pillar-3a", label: "Pillar 3a" },
  { value: "child-insurance", label: "Child insurance" },
  { value: "accident-insurance", label: "Accident insurance" },
];

const ACCEPT =
  ".doc,.docx,.xls,.xlsx,.csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

export default function AdminPage() {
  const { locale } = useParams() as { locale: string };

  const [product, setProduct] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const selectedLabel = product ? PRODUCT_LABELS[product] ?? product : null;

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  async function handleSend() {
    if (!product || sending) return;

    try {
      setSending(true);

      const form = new FormData();
      form.append("product", product);
      if (file) form.append("file", file, file.name);

      // TODO: replace with real API endpoint
      // const res = await fetch("/api/admin/send", { method: "POST", body: form });
      // if (!res.ok) throw new Error("Send failed");
      await new Promise((r) => setTimeout(r, 800)); // placeholder

      console.log("Sent:", { product, file: file?.name });
      alert(`Sent for: ${selectedLabel}${file ? `\nFile: ${file.name}` : ""}`);
      if (inputRef.current) inputRef.current.value = "";
      setFile(null);
    } finally {
      setSending(false);
    }
  }

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
          background: "color-mix(in srgb, var(--mantine-color-body) 82%, transparent)",
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
                src="/pax_logo.jpeg"
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
              Admin Console
            </Title>
            <Text c="dimmed" mt={4}>
              Configure products and send
            </Text>
          </div>

          <Paper
            radius="lg"
            p="lg"
            shadow="sm"
            withBorder={false}
            style={{
              width: "100%",
              background: "var(--mantine-color-body)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            <Stack gap="md">
              <div>
                <Text size="sm" c="dimmed">
                  Product
                </Text>
                {selectedLabel ? (
                  <Title order={4} mt={2} style={{ fontWeight: 600 }}>
                    {selectedLabel}
                  </Title>
                ) : (
                  <Text mt={2} c="dimmed" style={{ fontStyle: "italic" }}>
                    Select target
                  </Text>
                )}
              </div>

              <Select
                data={PRODUCT_OPTIONS}
                value={product}
                onChange={setProduct}
                placeholder="Choose a product"
                size="md"
                radius="md"
                variant="filled"
                aria-label="Choose a product"
                styles={{ input: { background: "var(--mantine-color-default)" } }}
              />

              <Divider
                my="xs"
                style={{
                  opacity: 0.6,
                  borderColor: "var(--mantine-color-default-border)",
                }}
              />

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                onChange={onFileChange}
                style={{ display: "none" }}
              />

              <Group gap="sm" align="stretch" grow>
                <Button
                  variant="default"
                  leftSection={<IconSettings2 size={16} />}
                  onClick={pickFile}
                  size="md"
                  fullWidth
                  aria-label="Choose rule file"
                >
                  Choose file
                </Button>

                <Button
                  variant="filled"
                  color="paxGreen"
                  leftSection={<IconSend size={16} />}
                  size="md"
                  disabled={!product}
                  loading={sending}
                  onClick={handleSend}
                  fullWidth
                  aria-label="Send"
                >
                  Send
                </Button>
              </Group>

              {file ? (
                <Text size="sm" c="dimmed">
                  Selected: {file.name} · {(file.size / 1024).toFixed(0)} KB
                </Text>
              ) : null}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
}
