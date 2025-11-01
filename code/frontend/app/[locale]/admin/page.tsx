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

export default function AdminPage() {
  const { locale } = useParams() as { locale: string };
  const [product, setProduct] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

      const res = await fetch("http://localhost:8000/admin/update_rules", {
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

  function handlePreview() {
    if (!file) {
      notifications.show({ title: "Missing file", message: "Choose a file.", color: "orange" });
      return;
    }
    console.log("Preview TODO");
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
              Admin Console
            </Title>
            <Text c="dimmed" mt={4}>
              Upload rules & preview
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
                notifications.show({ title: "Missing data", message: "Select a product and choose a file.", color: "orange" });
                return;
              }
              setConfirmOpen(true);
            }}
          />
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
