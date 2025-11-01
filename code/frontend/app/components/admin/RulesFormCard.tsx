"use client";
import { useMemo } from "react";
import { Button, Divider, FileInput, Group, Paper, Select, Stack, Text } from "@mantine/core";
import { IconFile } from "@tabler/icons-react";

type Props = {
  product: string | null;
  setProduct: (v: string | null) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  sending: boolean;
  onPreview: () => void;
  onUpdateRequest: () => void;
  previewing?: boolean; 
};

const PRODUCT_OPTIONS = [
  { value: "Pillar 3a", label: "Pillar 3a" },
  { value: "Child insurance", label: "Child insurance" },
  { value: "Accident insurance", label: "Accident insurance" },
] as const;

export default function RulesFormCard({
  product, setProduct, file, setFile, sending, onPreview, onUpdateRequest, previewing = false,
}: Props) {
  const fileInfo = useMemo(() => {
    if (!file) return null;
    const kb = (file.size / 1024).toFixed(0);
    return `${file.name} · ${kb} KB`;
  }, [file]);

  return (
    <Paper
      radius="lg"
      p="lg"
      shadow="sm"
      withBorder={false}
      style={{ background: "var(--mantine-color-body)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)" }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">Product</Text>

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

        <Divider my="xs" style={{ opacity: 0.6, borderColor: "var(--mantine-color-default-border)" }} />

        <Text size="sm" c="dimmed">Upload rule file (JSON)</Text>

        <FileInput
          placeholder="Select file"
          leftSection={<IconFile size={18} />}
          accept="application/json,.json"
          value={file}
          onChange={setFile}
          clearable
          aria-label="Rules JSON file"
        />

        {file && (
          <Text size="sm" c="dimmed">Selected: {fileInfo}</Text>
        )}

        <Group justify="center" mt="md" gap="sm">
          <Button
            variant="light"
            size="md"
            disabled={!file || !product || sending || previewing}
            loading={previewing}
            onClick={onPreview}
          >
            Preview
          </Button>
          <Button
            variant="filled"
            size="md"
            disabled={!product || !file || sending}
            loading={sending}
            onClick={onUpdateRequest}
          >
            Update
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
