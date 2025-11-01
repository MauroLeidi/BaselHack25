"use client";

import { useState } from "react";
import { Container, Stack, Title, Button, Text, Image, Group } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE, MIME_TYPES } from "@mantine/dropzone";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrop = (files: File[]) => {
    const f = files[0];
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleExtract = () => {
    // TODO: connect to OCR / extraction API
    router.push("/result?source=upload&mock=1");
  };

  return (
    <Container size="xs" py={40}>
      <Stack>
        <Title order={3}>Upload Form Image / PDF</Title>

        <Dropzone
          onDrop={handleDrop}
          accept={[...IMAGE_MIME_TYPE, MIME_TYPES.pdf]}
          maxSize={10 * 1024 ** 2}
        >
          <Stack align="center" py={40}>
            <Text>Drag & drop here or click to upload</Text>
            <Text size="sm" c="dimmed">Supported: PDF or photo (max 10MB)</Text>
          </Stack>
        </Dropzone>

        {preview && (
          <Image src={preview} alt="preview" radius="md" maw={300} mx="auto" mt="md" />
        )}

        {file && (
          <Group>
            <Button fullWidth radius="lg" onClick={handleExtract}>
              Extract Data
            </Button>
          </Group>
        )}
      </Stack>
    </Container>
  );
}
