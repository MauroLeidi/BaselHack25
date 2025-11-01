"use client";

import { useTranslations } from "next-intl";
import { useEffect, startTransition } from "react";
import {
  Button,
  Container,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Autocomplete,
  ActionIcon,
  Divider,
  Paper,
  Tooltip
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { useParams } from "next/navigation";

type Smoke = "yes" | "no" | null;
type Level = "hobby" | "competitive";
type SportEntry = { name: string; level: Level };

export default function OnlineFormPage() {
  const { locale } = useParams() as { locale: string };
  const t = useTranslations("form");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [smoke, setSmoke]         = useState<Smoke>(null);
  const [height, setHeight]       = useState<number | "">(""); // <-- height first
  const [weight, setWeight]       = useState<number | "">(""); // <-- then weight
  const [sports, setSports]       = useState<SportEntry[]>([{ name: "", level: "hobby" }]);

  const [cigarettesPerDay, setCigarettesPerDay] = useState<number | "">("");
  const [dob, setDob] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSmoker = smoke === "yes";

  const sportSuggestions = [
    "Basketball", "Football", "Running", "Cycling", "Swimming",
    "Climbing", "Skiing", "Snowboarding", "Martial arts",
    "Diving", "Paragliding", "Motorsport", "Rugby", "Tennis"
  ];



  function addSport() { setSports((s) => [...s, { name: "", level: "hobby" }]); }
  function removeSport(i: number) { setSports((s) => s.filter((_, idx) => idx !== i)); }
  function updateSport(i: number, patch: Partial<SportEntry>) {
    setSports((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function yearsAgo(n: number) { const d = new Date(); d.setFullYear(d.getFullYear() - n); return d; }
  function ageFrom(d: Date): number {
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const mmdd = (now.getMonth() + 1) * 100 + now.getDate();
    const mmddB = (d.getMonth() + 1) * 100 + d.getDate();
    if (mmdd < mmddB) a--;
    return a;
  }
  function formatDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (isSmoker) {
      const v = cigarettesPerDay === "" ? null : Number(cigarettesPerDay);
      if (v === null || v < 0) errs.cigarettesPerDay = "cigarettes_per_day must be 0 or greater";
      else if (v > 30) errs.cigarettesPerDay = "cigarettes_per_day cannot exceed 30";
    }

    if (height !== "") {
      const v = Number(height);
      if (v < 50) errs.height = "height_cm must be at least 50 cm";
      else if (v > 250) errs.height = "height_cm cannot exceed 250 cm";
    }

    if (weight !== "") {
      const v = Number(weight);
      if (v < 2) errs.weight = "weight_kg must be at least 2 kg";
      else if (v > 300) errs.weight = "weight_kg cannot exceed 300 kg";
    }

    if (!dob) {
      errs.dob = "date_of_birth is required";
    } else {
      const now = new Date();
      if (dob > now) errs.dob = "date_of_birth cannot be in the future";
      const a = ageFrom(dob);
      if (a < 1) errs.dob = "age must be at least 1 year";
      else if (a > 100) errs.dob = "age cannot exceed 100 years";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pax_form_prefill");
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<{
        first_name: string;
        last_name: string;
        smokes: boolean;
        cigarettes_per_day: number | null;
        height_cm: number | null;
        weight_kg: number | null;
        date_of_birth: string | null;
        sports: string[];            
      }>;

   
    startTransition(() => {
      if (data.first_name) setFirstName(data.first_name);
      if (data.last_name) setLastName(data.last_name);
      if (typeof data.smokes === "boolean") setSmoke(data.smokes ? "yes" : "no");
      if (typeof data.cigarettes_per_day === "number") setCigarettesPerDay(data.cigarettes_per_day);
      if (typeof data.height_cm === "number") setHeight(data.height_cm);
      if (typeof data.weight_kg === "number") setWeight(data.weight_kg);

      if (data.date_of_birth) {
        const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(data.date_of_birth);
        if (m) {
          const d = new Date(+m[3], +m[2] - 1, +m[1]);
          if (!Number.isNaN(d.getTime())) setDob(d);
        }
      }

      if (Array.isArray(data.sports) && data.sports.length > 0) {
        setSports(data.sports.map((name) => ({ name, level: "hobby" })));
      }
    });

   
    sessionStorage.removeItem("pax_form_prefill");
  } catch (e) {
    console.warn("Failed to apply prefill:", e);
  }
}, []);


 
  const isFormComplete =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    smoke !== null &&
    height !== "" &&
    weight !== "" &&
    dob !== null &&
    (!isSmoker || cigarettesPerDay !== "");

  async function handleSubmit() {
    if (!isFormComplete) { setErrors((e) => ({ ...e, form: t("errors.required") })); return; }
    if (!validate()) return;

    const cleanedSports = sports
      .map((r) => r.name.trim())
      .filter((name) => name.length > 0); 

    const payload = {
      first_name: firstName.trim(),
      last_name : lastName.trim(),
      smokes: isSmoker,
      cigarettes_per_day: isSmoker && cigarettesPerDay !== "" ? Number(cigarettesPerDay) : null,
      height_cm: Number(height),
      weight_kg: Number(weight),
      date_of_birth: dob ? formatDDMMYYYY(dob) : null,
      sports: cleanedSports,
    };

    console.log("SUBMIT payload (object):", payload);
    console.log("SUBMIT payload (json):\n", JSON.stringify(payload, null, 2));

    alert(t("submitted"));
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
        </div>
      <Container size="sm">
        <Stack align="center" gap="lg">
          <Stack gap={4} align="center">
            <Title order={2}>{t("title")}</Title>
            <Text c="dimmed" ta="center">{t("subtitle")}</Text>
            <LanguageSwitcher />
          </Stack>

          <Paper shadow="sm" radius="lg" p="lg" withBorder style={{ width: "100%", maxWidth: 640 }}>
            <Stack gap="md">
              <Group grow>
                <TextInput
                  label={t("firstName")}
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.currentTarget.value)}
                  required
                />
                <TextInput
                  label={t("lastName")}
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.currentTarget.value)}
                  required
                />
              </Group>

              <Group grow>
                <Select
                  label={t("smoke")}
                  value={smoke}
                  onChange={(v) => {
                    const val = (v as Smoke) ?? null;
                    setSmoke(val);
                    if (val !== "yes") setCigarettesPerDay("");
                  }}
                  data={[
                    { value: "no", label: t("no") },
                    { value: "yes", label: t("yes") }
                  ]}
                  required
                />

                <NumberInput
                  label={t("cigarettes_per_day")}
                  value={cigarettesPerDay}
                  onChange={setCigarettesPerDay}
                  min={1}
                  max={30}
                  step={1}
                  disabled={!isSmoker}
                  required={isSmoker}
                  error={errors.cigarettesPerDay}
                />

              </Group>

              <Group grow>
                <NumberInput
                  label={t("height")}
                  description="cm"
                  value={height}
                  onChange={setHeight}
                  min={50}
                  max={250}
                  required
                  error={errors.height}
                />
                <NumberInput
                  label={t("weight")}
                  description="kg"
                  value={weight}
                  onChange={setWeight}
                  min={2}
                  max={300}
                  precision={1}
                  step={0.5}
                  required
                  error={errors.weight}
                />
              </Group>

              <Group grow>
                <DatePickerInput
                  label={t("date_of_birth")}
                  placeholder="DD.MM.YYYY"
                  value={dob}
                  onChange={setDob}
                  valueFormat="DD.MM.YYYY"
                  editable="false"
                  minDate={yearsAgo(100)}
                  maxDate={yearsAgo(1)}
                  clearable={false}
                  error={errors.dob}
                  required
                />
              </Group>

              <Divider label={t("sport_section")} />

              <Stack gap="sm">
                {sports.map((row, i) => (
                  <Group key={i} align="end" wrap="nowrap">
                    <Autocomplete
                      label={t("sport_name")}
                      placeholder={t("sport_placeholder")}
                      data={sportSuggestions}
                      value={row.name}
                      onChange={(v) => updateSport(i, { name: v })}
                      w="100%"
                    />
                    <Select
                      label={t("sport_level")}
                      value={row.level}
                      onChange={(v) => updateSport(i, { level: (v as Level) ?? "hobby" })}
                      data={[
                        { value: "hobby", label: t("sport_hobby") },
                        { value: "competitive", label: t("sport_competitive") }
                      ]}
                      w={220}
                    />
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={t("remove")}
                      onClick={() => removeSport(i)}
                      disabled={sports.length === 1}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                ))}

                <Button leftSection={<IconPlus size={16} />} variant="light" onClick={addSport} maw={220}>
                  {t("add_sport")}
                </Button>
              </Stack>

              <Group justify="flex-end" mt="md">
                <Button
                  size="md"
                  radius="md"
                  onClick={handleSubmit}
                  disabled={
                    !(
                      firstName.trim() &&
                      lastName.trim() &&
                      smoke !== null &&
                      height !== "" &&
                      weight !== "" &&
                      dob !== null &&
                      (!isSmoker || cigarettesPerDay !== "")
                    ) || Object.keys(errors).length > 0
                  }
                >
                  {t("submit")}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
}
