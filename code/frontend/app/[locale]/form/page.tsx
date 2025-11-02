"use client";

import DobField from "@/app/components/form/DobField";
import MetricsFields from "@/app/components/form/MetricsFields";
import NameFields from "@/app/components/form/NameFields";
import SmokingFields from "@/app/components/form/SmokingFields";
import SportsSection from "@/app/components/form/SportsSection";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { formatDDMMYYYY, parseLooseDob } from "@/helpers/form/date";
import { prefillAll, PrefillPayload } from "@/helpers/form/prefill";
import { Errors, Smoke, SportEntry } from "@/helpers/form/types";
import { makeValidators } from "@/helpers/form/validators";
import {
  ActionIcon, Button, Container, Divider, Group, Paper, Stack, Text, Title, Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChevronLeft, IconFileUpload } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { NumberInput } from "@mantine/core";


export default function OnlineFormPage() {
  const { locale } = useParams() as { locale: string };
  const t = useTranslations("form");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [smoke, setSmoke] = useState<Smoke>(null);
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [cigarettesPerDay, setCigarettesPerDay] = useState<number | "">("");
  const [dob, setDob] = useState<Date | null>(null);
  const [sports, setSports] = useState<SportEntry[]>([{ name: "", level: "hobby" }]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const shownNotiIdsRef = useRef<Set<string>>(new Set());
  const [insurancePrice, setInsurancePrice] = useState<number | "">("");


  const isSmoker = smoke === "yes";

  const validators = useMemo(() => makeValidators(t), [t]);
  function notifyErrorOnce(id: string, title: string, message: string) {
    if (shownNotiIdsRef.current.has(id)) return;
    notifications.show({ id, title, message, color: "red", autoClose: 5000, withBorder: true });
    shownNotiIdsRef.current.add(id);
  }
  function clearErrorNoti(id: string) {
    if (!shownNotiIdsRef.current.has(id)) return;
    notifications.hide(id);
    shownNotiIdsRef.current.delete(id);
  }

  function setFieldError(name: string, message: string | null) {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
    const notiId = `err:${name}`;
    if (message) notifyErrorOnce(notiId, t("errors.title") ?? "Validation error", message);
    else clearErrorNoti(notiId);
  }

  const onBlurFirstName = () => setFieldError("firstName", validators.firstName(firstName));
  const onBlurLastName = () => setFieldError("lastName", validators.lastName(lastName));
  const onBlurCPD = () => setFieldError("cigarettesPerDay", validators.cigarettesPerDay(cigarettesPerDay, isSmoker));
  const onBlurHeight = () => setFieldError("height", validators.height(height));
  const onBlurWeight = () => setFieldError("weight", validators.weight(weight));
  const onBlurInsurancePrice = () =>
  setFieldError(
    "insurancePrice",
    insurancePrice === "" || Number(insurancePrice) < 1 ? t("errors.insurance_price_invalid") : null
  );


  useEffect(() => {
    if (!isSmoker) {
      setCigarettesPerDay("");
      setFieldError("cigarettesPerDay", null);
    }
  }, [isSmoker]);



  useEffect(() => {
    const raw = sessionStorage.getItem("pax_form_prefill");
    if (!raw) return;

    let applied = 0;
    try {
      const data = JSON.parse(raw) as PrefillPayload;
      applied = prefillAll({
        data,
        setFirstName, setLastName,
        setSmoke, setCigarettesPerDay,
        setHeight, setWeight,
        setDob, setSports,
        setInsurancePrice
      });
    } catch { }
    finally {
      sessionStorage.removeItem("pax_form_prefill");
    }

    if (applied > 0) {
      notifications.show({
        title: "Prefilled",
        message: "We prefilled your form from the uploaded document.",
        color: "blue",
        autoClose: 4000,
      });
    }
  }, []);

  const isInsuranceValid =
  typeof insurancePrice === "number" && insurancePrice >= 1;
  const isFormComplete =
    firstName.trim() &&
    lastName.trim() &&
    smoke !== null &&
    height !== "" &&
    weight !== "" &&
    dob !== null &&
    (!isSmoker || cigarettesPerDay !== "") &&
    isInsuranceValid


  function validateAll(): boolean {
    const e: Errors = {};
    const f1 = validators.firstName(firstName); if (f1) e.firstName = f1;
    const f2 = validators.lastName(lastName); if (f2) e.lastName = f2;
    const f3 = validators.smoke(smoke); if (f3) e.smoke = f3;
    const f4 = validators.cigarettesPerDay(cigarettesPerDay, isSmoker); if (f4) e.cigarettesPerDay = f4;
    const f5 = validators.height(height); if (f5) e.height = f5;
    const f6 = validators.weight(weight); if (f6) e.weight = f6;
    const f7 = validators.dob(dob); if (f7) e.dob = f7;
    const f8 =
      insurancePrice === "" || Number(insurancePrice) < 1
        ? t("errors.insurance_price_invalid")
        : null;
    if (f8) e.insurancePrice = f8;

    setErrors(e);
    Object.entries(e).forEach(([k, msg]) =>
      notifyErrorOnce(`err:${k}`, t("errors.title") ?? "Validation error", msg)
    );
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!isFormComplete || !validateAll()) {
      notifications.show({
        title: t("errors.title") ?? "Validation error",
        message: t("errors.fix_fields") ?? "Please fix the highlighted fields.",
        color: "red",
        autoClose: 6000,
      });
      return;
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      smokes: isSmoker,
      cigarettes_per_day: isSmoker && cigarettesPerDay !== "" ? Number(cigarettesPerDay) : null,
      height_cm: Number(height),
      weight_kg: Number(weight),
      date_of_birth: formatDDMMYYYY(
      dob instanceof Date ? dob : parseLooseDob(String(dob))
    ),
      sports: sports.map((r) => r.name.trim()).filter(Boolean),
      insurance_price: Number(insurancePrice),
    };

    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json = (() => { try { return JSON.parse(text); } catch { return { detail: text }; } })();

      if (!res.ok) {
        notifications.show({ title: "Predict failed", message: json.detail ?? "Unknown error", color: "red", autoClose: 6000 });
        return;
      }

      sessionStorage.setItem("pax_predict_result", JSON.stringify(json));
      notifications.show({ title: t("title"), message: t("submitted"), color: "green", autoClose: 2500 });
      window.location.assign(`/${locale}/result`);
    } catch (e: any) {
      notifications.show({ title: "Network error", message: e?.message ?? "Failed to reach server", color: "red", autoClose: 6000 });
    }
    finally {
      setSubmitting(false);
    }
  }

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
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 10 }}>
        <Tooltip label="Back" withArrow>
          <ActionIcon component={Link} href={`/${locale}`} variant="subtle" radius="xl" size="lg" aria-label="Back">
            <IconChevronLeft size={18} />
          </ActionIcon>
        </Tooltip>
      </div>

      <Container
        size="false"
        style={{
          width: "100%",
          maxWidth: 640, // enforce same width everywhere
          display: "flex",
          justifyContent: "center",
        }}
          >
        <Stack align="center" gap="lg">
          <Stack gap={4} align="center">
            <Title order={2}>{t("title")}</Title>
            <Text c="dimmed" ta="center">{t("subtitle")}</Text>
            <LanguageSwitcher />
          </Stack>

          <Paper
            shadow="sm"
            radius="lg"
            p="lg"
            withBorder
            style={{
              width: "100%",
              maxWidth: 640,
              minWidth: 640, // lock width to avoid language text pushing form
            }}
          >

            <Stack gap="md">
              <NameFields
                firstName={firstName} lastName={lastName}
                setFirstName={setFirstName} setLastName={setLastName}
                errors={errors}
                onBlurFirstName={onBlurFirstName} onBlurLastName={onBlurLastName}
                labelFirst={t("firstName")} labelLast={t("lastName")}
              />

              <SmokingFields
                smoke={smoke} setSmoke={setSmoke}
                cigarettesPerDay={cigarettesPerDay} setCigarettesPerDay={setCigarettesPerDay}
                isSmoker={isSmoker} errors={errors} onBlurCPD={onBlurCPD}
                labelSmoke={t("smoke")} labelYes={t("yes")} labelNo={t("no")} labelCPD={t("cigarettes_per_day")}
              />

              <MetricsFields
                height={height} setHeight={setHeight}
                weight={weight} setWeight={setWeight}
                onBlurHeight={onBlurHeight} onBlurWeight={onBlurWeight}
                errors={errors}
                labelHeight={t("height")} labelWeight={t("weight")}
              />

              <DobField
                dob={dob}
                setDob={setDob}
                error={errors.dob}
                label={t("date_of_birth")}
                placeholder="DD.MM.YYYY"
                onValidate={(d) => setFieldError("dob", validators.dob(d))}
              />

              <Divider label={t("sport_section")} />

              <SportsSection
                sports={sports} setSports={setSports}
                labelSection={t("sport_section")}
                labelName={t("sport_name")}
                placeholderName={t("sport_placeholder")}
                labelLevel={t("sport_level")}
                labelHobby={t("sport_hobby")}
                labelCompetitive={t("sport_competitive")}
                labelAdd={t("add_sport")}
                labelRemove={t("remove")}
              />

              <Divider label={t("price_section")} />

              <NumberInput
                label={t("insurance_price")}
                required
                value={insurancePrice}
                onChange={(value) => setInsurancePrice(value === '' ? '' : Number(value))}
                min={1}
                step={1}
                decimalScale={2}
                onBlur={onBlurInsurancePrice}
                error={errors.insurancePrice}
                style={{ width: "50%" }}
              />


              <Group justify="flex-end" mt="md">
                <Button
                  size="md"
                  radius="md"
                  onClick={handleSubmit}
                  leftSection={<IconFileUpload size={18} />}
                  loading={submitting}
                  disabled={!isFormComplete || Object.keys(errors).length > 0 || submitting}
                >
                  {submitting ? t("reading") : t("submit")}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
}
