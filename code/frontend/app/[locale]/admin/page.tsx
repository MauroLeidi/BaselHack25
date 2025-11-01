"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { notifications } from "@mantine/notifications";
import {
  ActionIcon,
  Button,
  Container,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
  FileInput,
  TextInput
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronLeft, IconSend, IconFile, IconEye} from "@tabler/icons-react";
import { Alert, Badge,Checkbox,  } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";


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




export default function AdminPage() {
  const { locale } = useParams() as { locale: string };

  const [product, setProduct] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const [opened, { open, close }] = useDisclosure(false); // modal state
  const inputRef = useRef<HTMLInputElement>(null);
const [ack, setAck] = useState(false);
const [confirmText, setConfirmText] = useState("");

  async function handleSendConfirmed() {
    if (!product || !file || sending) return;
    close();

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
    console.log("TODO")
  }

  function handleSendClick() {
    if (!product) {
      notifications.show({
        title: "Missing product",
        message: "Please select a product first.",
        color: "orange",
      });
      return;
    }
    if (!file) {
      notifications.show({
        title: "Missing file",
        message: "Please choose a file before sending.",
        color: "orange",
      });
      return;
    }
    open(); // show confirmation popup
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

          <Paper
            radius="lg"
            p="lg"
            shadow="sm"
            withBorder={false}
            style={{
              width: "100%",
              background: "var(--mantine-color-body)",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Product
              </Text>

              <Select
                data={PRODUCT_OPTIONS}
                value={product}
                onChange={setProduct}
                placeholder="Choose a product"
                size="md"
                radius="md"
                variant="filled"
                aria-label="Choose a product"
                styles={{
                  input: { background: "var(--mantine-color-default)" },
                }}
              />

              <Divider
                my="xs"
                style={{
                  opacity: 0.6,
                  borderColor: "var(--mantine-color-default-border)",
                }}
              />
              <Text size="sm" c="dimmed">
                Upload rule file
              </Text>
              <FileInput
                placeholder="Select file"
                leftSection={<IconFile size={18} />}
                accept="application/json, .json"
                value={file}
                onChange={setFile}
                ref={inputRef}
                clearable
              />

              {file && (
                <Text size="sm" c="dimmed">
                  Selected: {file.name} · {(file.size / 1024).toFixed(0)} KB
                </Text>
              )}

              <Group justify="center" mt="md" gap="sm">
                <Button
                  variant="light"
                  color="pax"
                  size="md"
                  disabled={!file}
                  onClick={handlePreview}
                >
                  Preview
                </Button>

                <Button
                  variant="filled"
                  color="paxGreen"
                  size="md"
                  disabled={!product || !file}
                  loading={sending}
                  onClick={handleSendClick}
                >
                  Update
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Container>

      {/* Confirmation modal */}
     <Modal
  opened={opened}
  onClose={() => { setAck(false); close(); }}
  centered
  radius="lg"
  size="sm"
  withCloseButton
  title={
    <Group gap="xs">
      <IconAlertTriangle size={18} color="var(--mantine-color-red-6)" />
      <Text fw={600}>Send and overwrite rules?</Text>
    </Group>
  }
  overlayProps={{ blur: 2, opacity: 0.35 }}
  closeOnEscape
  closeOnClickOutside={false}
>
  <Stack gap="sm">
   

    <Group gap="xs">
      <Text size="sm" c="dimmed">Product:</Text>
      <Badge variant="light">{product ?? "—"}</Badge>
      {file && (
        <>
          <Text size="sm" c="dimmed">File:</Text>
          <Badge variant="light">{file.name}</Badge>
        </>
      )}
    </Group>

    <Checkbox
      checked={ack}
      onChange={(e) => setAck(e.currentTarget.checked)}
      label="I understand"
      radius="sm"
    />

    <Group grow gap="sm" mt="md" w="100%">
  <Button
    variant="default"
    fullWidth
    onClick={() => { setAck(false); close(); }}
  >
    Cancel
  </Button>

  <Button
    color="red"
    variant="filled"
    fullWidth
    onClick={handleSendConfirmed}
    disabled={!ack || !product || !file}
    loading={sending}
  >
    Send & overwrite
  </Button>
</Group>

  </Stack>
</Modal>

    </div>
  );
}
