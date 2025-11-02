"use client";

import {
  Button,
  Container,
  Paper,
  Stack,
  Title,
  Text,
  Group,
  Divider,
  ThemeIcon,
  Badge,
  Grid,
} from "@mantine/core";
import { IconCircleCheck, IconAlertTriangle, IconX, IconInfoCircle } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
interface PredictResp {
  status?: string;
  reason?: string;
  prediction_output?: {
    predicted_price: number;
    base_price: number;
    adjustment_percentage: number;
    adjustment_euro: number; 
  };
  reasoning_advanced?: { explanation?: string, decision?:
    | "rejected"
    | "accepted with extra charge"
    | "accepted"
    | "need for additional information"; };
}


export default function ResultPage() {
  const [result, setResult] = useState<PredictResp | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { locale } = useParams() as { locale?: string };

  const bgStyle: React.CSSProperties = useMemo(
    () => ({
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      background:
        "radial-gradient(80rem 80rem at 20% -10%, rgba(94,68,255,0.06), transparent 50%), radial-gradient(80rem 80rem at 120% 120%, rgba(36,186,111,0.08), transparent 40%)",
    }),
    []
  );

  useEffect(() => {
    // 1) Prefer result saved by the form page
    const rawResult =
      typeof window !== "undefined" ? sessionStorage.getItem("pax_predict_result") : null;
    if (rawResult) {
      try {
        console.log(JSON.parse(rawResult))
        setResult(JSON.parse(rawResult));
        setLoading(false);
        return;
      } catch {
        setResult({ status: "error", reason: "Invalid result in session" });
        setLoading(false);
        return;
      }
    }
  }, []);

  const fmtCHF = (n: number) =>
    new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(n);

  // Decision flags (exact strings)
  const norm = (s?: string) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ") as Decision;
  const decision = norm(result?.decision);

  const isRejected = decision === "rejected";
  const isAcceptedWithCharge = decision === "accepted with extra charge";
  const isAcceptedNoCharge = decision === "accepted";
  const needsMoreInfo = decision === "need for additional information";

  // Decision UI props
  const decisionProps = useMemo(() => {
    switch (decision) {
      case "rejected":
        return { color: "red", icon: <IconX size={44} />, label: result?.decision };
      case "accepted":
        return { color: "paxGreen", icon: <IconCircleCheck size={44} />, label: result?.decision };
      case "accepted with extra charge":
        return { color: "yellow", icon: <IconAlertTriangle size={44} />, label: result?.decision };
      case "need for additional information":
        return { color: "blue", icon: <IconInfoCircle size={44} />, label: result?.decision };
      default:
        return { color: "pax", icon: <IconInfoCircle size={44} />, label: result?.decision ?? "Pending" };
    }
  }, [decision, result?.decision]);

  function goHome() {
    router.push(locale ? `/${locale}` : "/");
  }

  const po = result?.prediction_output;
  const showAdjustmentBox =
    !!po &&
    isAcceptedWithCharge &&
    typeof po.adjustment_percentage === "number" &&
    po.adjustment_percentage > 0;

  const showAcceptedSinglePrice = !!po && isAcceptedNoCharge;

  return (
    <div style={bgStyle}>
      <Container style={{ width: "100%", maxWidth: 640 }}>
        <Paper withBorder radius="lg" p="lg" shadow="sm">
          <Stack gap="md">
            <Stack align="center">
              <Image src="/pax_logo.svg" alt="PAX" width={120} height={40} priority />
            </Stack>
            <Paper p="md" radius="md" bg="var(--mantine-color-pax-6)">
              <Title order={3} c="white" ta="center">
                Application Result
              </Title>
            </Paper>

            {loading ? (
              <Stack align="center" gap="md">
                <Text c="dimmed">Loading…</Text>
              </Stack>
            ) : result ? (
              <Stack gap="lg">
                <Stack align="center" gap={6}>
                  <ThemeIcon size={72} radius={999} variant="light" color={decisionProps.color}>
                    {decisionProps.icon}
                  </ThemeIcon>
                  <Badge size="md" variant="light" color={decisionProps.color} tt="uppercase">
                    Decision
                  </Badge>
                  <Title order={4} c={decisionProps.color as any} ta="center">
                    {decisionProps.label ?? "—"}
                  </Title>
                </Stack>

                {result.reason && (
                  <Paper withBorder radius="md" p="md">
                    <Stack gap={4}>
                      <Text size="xs" c="pax" ta="center" fw={600} tt="uppercase">
                        Reason
                      </Text>
                      <Text ta="center" c="dimmed">
                        {result.reason}
                      </Text>
                    </Stack>
                  </Paper>
                )}

                {showAdjustmentBox && (
                  <Paper radius="md" p="md" withBorder>
                    <Stack gap="sm">
                      <Text size="xs" c="pax" fw={700} tt="uppercase" ta="center">
                        Premium Adjustment
                      </Text>

                      <Grid gutter="md">
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Stack gap={2} align="center">
                            <Text size="sm" c="dimmed">Base Price</Text>
                            <Text fw={800}>{fmtCHF(po!.base_price ?? 0)}</Text>
                          </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Stack gap={2} align="center">
                            <Text size="sm" c="dimmed">Final Price</Text>
                            <Text fw={800} c="paxGreen">{fmtCHF(po!.predicted_price)}</Text>
                          </Stack>
                        </Grid.Col>
                      </Grid>

                      <Divider my="xs" />

                      {typeof po!.adjustment_euro === "number" && (
                        <Group justify="space-between">
                          <Text c="dimmed" fw={500}>Additional charge</Text>
                          <Group gap={8}>
                            <Text fw={800} c="paxGreen">+{fmtCHF(po!.adjustment_euro)}</Text>
                            <Text size="sm" fw={700} c="pax">
                              (+{po!.adjustment_percentage!.toFixed(1)}%)
                            </Text>
                          </Group>
                        </Group>
                      )}
                    </Stack>
                  </Paper>
                )}

                {showAcceptedSinglePrice && (
                  <Paper radius="md" p="md" withBorder>
                    <Stack gap="sm" align="center">
                      <Text size="xs" c="pax" fw={700} tt="uppercase" ta="center">
                        Insurance Price
                      </Text>
                      <Text fw={900} c="paxGreen" style={{ fontSize: 28 }}>
                        {fmtCHF(po!.base_price)}
                      </Text>
                    </Stack>
                  </Paper>
                )}

                {result.reasoning_advanced?.explanation && (
                  <Paper withBorder radius="md" p="md">
                    <Stack gap={4}>
                      <Text size="xs" c="pax" fw={600} tt="uppercase">
                        Detailed Explanation
                      </Text>
                      <Text>{result.reasoning_advanced.explanation.replace(/^"|"$/g, "")}</Text>
                    </Stack>
                  </Paper>
                )}

                <Group grow>
                  <Button radius="lg" color="paxGreen" onClick={goHome}>
                    Back to Start
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack align="center" gap="md">
                <Text c="dimmed">No result found. Submit the form first.</Text>
                <Button radius="lg" color="paxGreen" onClick={goHome}>
                  Back to Start
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Container>
    </div>
  );
}
