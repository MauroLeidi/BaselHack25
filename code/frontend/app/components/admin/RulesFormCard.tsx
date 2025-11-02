"use client";
import { useMemo } from "react";
import { Button, Divider, FileInput, Group, Paper, Select, Stack, Text } from "@mantine/core";
import { IconFile } from "@tabler/icons-react";
import {useLocale, useMessages, useTranslations} from "next-intl";

type ProductValue = "pillar-3a" | "child-insurance" | "accident-insurance";

type Props = {
  product: ProductValue | null;
  setProduct: (v: ProductValue | null) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  sending: boolean;
  onPreview: () => void;
  onUpdateRequest: () => void;
  previewing?: boolean;
};

export function useProductOptions() {
  const locale = useLocale();
  const messages = useMessages() as {products: Record<ProductValue, string>};
  const tProd = useTranslations("products");

  const options = useMemo(
    () =>
      (Object.keys(messages.products) as ProductValue[]).map((v) => ({
        value: v,            // stable canonical key
        label: tProd(v),     // localized label
      })),
    [messages, tProd, locale]
  );

  return options;
};

export default function RulesFormCard({
  product, setProduct, file, setFile, sending, onPreview, onUpdateRequest, previewing = false,
}: Props) {
  const tAdmin = useTranslations("admin");
  const tProd = useTranslations("products");

  const productValues: ProductValue[] = ["pillar-3a", "child-insurance", "accident-insurance"];
  const options = useMemo(
    () => productValues.map((k) => ({ value: k, label: tProd(k) })),
    [tProd]
  );

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
        <Text size="sm" c="dimmed">{tAdmin("product_label")}</Text>

        <Select
          data={options}
          value={product}
          onChange={(v) => setProduct((v as ProductValue) ?? null)}
          placeholder={tAdmin("product_placeholder")}
          size="md"
          radius="md"
          variant="filled"
          aria-label={tAdmin("product_placeholder")}
          styles={{ input: { background: "var(--mantine-color-default)" } }}
        />

        <Divider my="xs" style={{ opacity: 0.6, borderColor: "var(--mantine-color-default-border)" }} />

        <Text size="sm" c="dimmed">{tAdmin("upload_rules")}</Text>

        <FileInput
          placeholder={tAdmin("file_placeholder")}
          leftSection={<IconFile size={18} />}
          accept="application/json,.json"
          value={file}
          onChange={setFile}
          clearable
          aria-label="Rules JSON file"
        />

        {file && (
          <Text size="sm" c="dimmed">
            {tAdmin("selected")}: {fileInfo}
          </Text>
        )}

        <Group justify="center" mt="md" gap="sm">
          <Button
            variant="light"
            size="md"
            disabled={!file || !product || sending || previewing}
            loading={previewing}
            onClick={onPreview}
          >
            {tAdmin("preview")}
          </Button>
          <Button
            variant="filled"
            size="md"
            disabled={!product || !file || sending}
            loading={sending}
            onClick={onUpdateRequest}
          >
            {tAdmin("update")}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
