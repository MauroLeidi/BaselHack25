"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Group,
} from "@mantine/core";
import Link from "next/link";
import { useParams } from "next/navigation";

type PredictResp = {
  status?: string;
  decision?: string;
  reason?: string;
  [k: string]: any;
};

export default function ResultPage() {
  const { locale } = useParams() as { locale: string };
  const [result, setResult] = useState<PredictResp | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("pax_predict_result");
    if (raw) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResult(JSON.parse(raw));
      } catch {
        setResult({ status: "error", reason: "Invalid result" });
      }
    }
  }, []);

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
        <Paper
          shadow="sm"
          radius="lg"
          p="xl"
          withBorder
          style={{ width: "100%", maxWidth: 600 }}
        >
          <Stack gap="lg" align="center">
            <Title order={2}>Application Result</Title>

            {result ? (
              <Stack gap="xs" align="center">
                <Text size="sm" c="dimmed">
                  Status
                </Text>
                <Text fw={600}>{result.status ?? "—"}</Text>

                <Text size="sm" c="dimmed" mt="sm">
                  Decision
                </Text>
                <Text size="xl" fw={700} c="pax">
                  {result.decision ?? "—"}
                </Text>

                <Text size="sm" c="dimmed" mt="sm">
                  Reason
                </Text>
                <Text ta="center" fw={500}>
                  {result.reason ?? "—"}
                </Text>
              </Stack>
            ) : (
              <Text c="dimmed">No result found. Please submit the form first.</Text>
            )}

            <Group justify="center" mt="lg">
              <Button
                component={Link}
                href={`/${locale}`}
                size="md"
                radius="md"
                color="pax"
              >
                Back to start
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </div>
  );
}
