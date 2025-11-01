"use client";

import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import {
  ActionIcon,
  Autocomplete,
  Button,
  Container,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconChevronLeft, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";

type Smoke = "yes" | "no" | null;
type Level = "hobby" | "competitive";
type SportEntry = { name: string; level: Level };

export default function OnlineFormPage() {
  const { locale } = useParams() as { locale: string };
  const t = useTranslations("form");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [smoke, setSmoke] = useState<Smoke>(null);
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [sports, setSports] = useState<SportEntry[]>([{ name: "", level: "hobby" }]);

  const [cigarettesPerDay, setCigarettesPerDay] = useState<number | "">("");
  const [dob, setDob] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const shownNotiIdsRef = useRef<Set<string>>(new Set()); // avoid duplicate popups

  const isSmoker = smoke === "yes";

  const sportSuggestions = [
    "Basketball",
    "Football",
    "Running",
    "Cycling",
    "Swimming",
    "Climbing",
    "Skiing",
    "Snowboarding",
    "Martial arts",
    "Diving",
    "Paragliding",
    "Motorsport",
    "Rugby",
    "Tennis",
  ];

  function addSport() {
    setSports((s) => [...s, { name: "", level: "hobby" }]);
  }
  function removeSport(i: number) {
    setSports((s) => s.filter((_, idx) => idx !== i));
  }
  function updateSport(i: number, patch: Partial<SportEntry>) {
    setSports((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function yearsAgo(n: number) {
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    return d;
  }
  function formatDDMMYYYY(d: string | null) {
    if (!d) return "";
    const [year, month, day] = d.split("-");
    return `${day}.${month}.${year}`;
  }

  // ---- notifications helpers ----
  function notifyErrorOnce(id: string, title: string, message: string) {
    if (shownNotiIdsRef.current.has(id)) return;
    notifications.show({
      id,
      title,
      message,
      color: "red",
      autoClose: 5000,
      withBorder: true,
    });
    shownNotiIdsRef.current.add(id);
  }
  function clearErrorNoti(id: string) {
    if (shownNotiIdsRef.current.has(id)) {
      notifications.hide(id);
      shownNotiIdsRef.current.delete(id);
    }
  }

  const NAME_REGEX = /^\p{L}+(?:[ '\-]\p{L}+)*$/u;

  
  // ---- field validators (return message or null) ----
  const validators = useMemo(
    () => ({
      firstName: (v: string) => {
        const val = v.trim();
        if (val.length === 0) return t("errors.first_name_required");
        if (!NAME_REGEX.test(val)) return t("errors.name_invalid");
        return null;
      },
      lastName: (v: string) => {
        const val = v.trim();
        if (val.length === 0) return t("errors.last_name_required");
        if (!NAME_REGEX.test(val)) return t("errors.name_invalid");
        return null;
      },
      smoke: (v: Smoke) => (v === null ? t("errors.smoke_required") : null),
      cigarettesPerDay: (v: number | "" , smoker: boolean) => {
        if (!smoker) return null;
        if (v === "") return t("errors.cpd_required");
        const n = Number(v);
        if (Number.isNaN(n) || n < 0) return t("errors.cpd_min");
        if (n > 30) return t("errors.cpd_max");
        return null;
      },
      height: (v: number | "") => {
        if (v === "") return t("errors.height_required");
        const n = Number(v);
        if (n < 50) return t("errors.height_min");
        if (n > 250) return t("errors.height_max");
        return null;
      },
      weight: (v: number | "") => {
        if (v === "") return t("errors.weight_required");
        const n = Number(v);
        if (n < 2) return t("errors.weight_min");
        if (n > 300) return t("errors.weight_max");
        return null;
      },
      dob: (v: Date | null | string) => {
      const d = (v);
      if (!d) return t("errors.dob_required");

      const now = new Date();
      const minDob = yearsAgo(100);
      const maxDob = yearsAgo(1);

      if (d > now) return t("errors.dob_future");
      if (d < minDob) return t("errors.age_max");
      if (d > maxDob) return t("errors.age_min_exact");
      return null;
    },

    }),
    [t]
  );

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

  // ---- blur handlers to show notifications immediately ----
  function onBlurFirstName() {
    setFieldError("firstName", validators.firstName(firstName));
  }
  function onBlurLastName() {
    setFieldError("lastName", validators.lastName(lastName));
  }
  function onBlurHeight() {
    setFieldError("height", validators.height(height));
  }
  function onBlurWeight() {
    setFieldError("weight", validators.weight(weight));
  }
  function onBlurCPD() {
    setFieldError("cigarettesPerDay", validators.cigarettesPerDay(cigarettesPerDay, isSmoker));
  }

  // Clear CPD error when toggling non-smoker
  useEffect(() => {
    if (!isSmoker) {
      setCigarettesPerDay("");
      setFieldError("cigarettesPerDay", null);
    }
  }, [isSmoker]);

  // Prefill + notification (unchanged except dob is Date now)
  useEffect(() => {
    const raw = sessionStorage.getItem("pax_form_prefill");
    if (!raw) return;

    let applied = 0;
    try {
      const data = JSON.parse(raw) as Partial<{
        first_name: string;
        firstName: string;
        last_name: string;
        lastName: string;
        smokes: boolean;
        smoke: "yes" | "no";
        cigarettes_per_day: number | null;
        cigarettesPerDay: number | null;
        height_cm: number | null;
        height: number | null;
        weight_kg: number | null;
        weight: number | null;
        date_of_birth: string | null;
        dob: string | null; // "DD.MM.YYYY" | "YYYY-MM-DD"
        sports: string[];
      }>;

      if (data.first_name || data.firstName) {
        setFirstName((data.first_name ?? data.firstName ?? "").trim());
        applied++;
      }
      if (data.last_name || data.lastName) {
        setLastName((data.last_name ?? data.lastName ?? "").trim());
        applied++;
      }

      if (typeof data.smokes === "boolean") {
        setSmoke(data.smokes ? "yes" : "no");
        applied++;
      } else if (data.smoke === "yes" || data.smoke === "no") {
        setSmoke(data.smoke);
        applied++;
      }

      if (data.cigarettes_per_day != null) {
        setCigarettesPerDay(Number(data.cigarettes_per_day));
        applied++;
      } else if (data.cigarettesPerDay != null) {
        setCigarettesPerDay(Number(data.cigarettesPerDay));
        applied++;
      }

      if (data.height_cm != null) {
        setHeight(Number(data.height_cm));
        applied++;
      } else if (data.height != null) {
        setHeight(Number(data.height));
        applied++;
      }

      if (data.weight_kg != null) {
        setWeight(Number(data.weight_kg));
        applied++;
      } else if (data.weight != null) {
        setWeight(Number(data.weight));
        applied++;
      }

      if (Array.isArray(data.sports) && data.sports.length > 0) {
        setSports(data.sports.map((name) => ({ name, level: "hobby" as const })));
        applied++;
      }

      const rawDob = data.date_of_birth ?? data.dob;
      if (rawDob) {
        let parsed: Date | null = null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
          const [y, m, d] = rawDob.split("-").map(Number);
          parsed = new Date(y, m - 1, d);
        } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(rawDob)) {
          const [d, m, y] = rawDob.split(".").map(Number);
          parsed = new Date(y, m - 1, d);
        } else {
          const dt = new Date(rawDob);
          if (!isNaN(dt.getTime())) parsed = dt;
        }
        if (parsed) {
          setDob(parsed);
          applied++;
        }
      }
    } catch (e) {
      console.warn("prefill parse error", e);
    } finally {
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

  // Overall completeness gate
  const isFormComplete =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    smoke !== null &&
    height !== "" &&
    weight !== "" &&
    dob !== null &&
    (!isSmoker || cigarettesPerDay !== "");

  // Validate all fields (used on submit)
  function validateAll(): boolean {
    const e: Record<string, string> = {};

    const f1 = validators.firstName(firstName);
    if (f1) e.firstName = f1;

    const f2 = validators.lastName(lastName);
    if (f2) e.lastName = f2;

    const f3 = validators.smoke(smoke);
    if (f3) e.smoke = f3;

    const f4 = validators.cigarettesPerDay(cigarettesPerDay, isSmoker);
    if (f4) e.cigarettesPerDay = f4;

    const f5 = validators.height(height);
    if (f5) e.height = f5;

    const f6 = validators.weight(weight);
    if (f6) e.weight = f6;

    const f7 = validators.dob(dob);
    if (f7) e.dob = f7;

    setErrors(e);

    // Push notifications for any new errors not already shown
    Object.entries(e).forEach(([k, msg]) => {
      notifyErrorOnce(`err:${k}`, t("errors.title") ?? "Validation error", msg);
    });

    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    console.log("[DOB:state before payload]", dob, {
    type: typeof dob,
    isDate: dob instanceof Date,
    iso: dob ? dob.toISOString() : null,
  });
    if (!isFormComplete) {
      setErrors((prev) => ({ ...prev, form: t("errors.required") }));
      notifications.show({
        title: t("errors.title") ?? "Form incomplete",
        message: t("errors.required"),
        color: "red",
        autoClose: 6000,
      });
      return;
    }

    if (!validateAll()) {
      notifications.show({
        title: t("errors.title") ?? "Validation error",
        message: t("errors.fix_fields") ?? "Please fix the highlighted fields.",
        color: "red",
        autoClose: 6000,
      });
      return;
    }

    const cleanedSports = sports.map((r) => r.name.trim()).filter(Boolean);
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      smokes: isSmoker,
      cigarettes_per_day: isSmoker && cigarettesPerDay !== "" ? Number(cigarettesPerDay) : null,
      height_cm: Number(height),
      weight_kg: Number(weight),
      date_of_birth: formatDDMMYYYY(dob), // "DD.MM.YYYY"
      sports: cleanedSports,
    };
    console.log("[Payload to backend]", payload);
    console.table(payload);

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("dob: sent as", formatDDMMYYYY(dob));


      const text = await res.text();
      const json = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { detail: text };
        }
      })();

      if (!res.ok) {
        notifications.show({
          title: "Predict failed",
          message: json.detail ?? "Unknown error",
          color: "red",
          autoClose: 6000,
        });
        return;
      }

      sessionStorage.setItem("pax_predict_result", JSON.stringify(json));

      notifications.show({
        title: t("title"),
        message: t("submitted"),
        color: "green",
        autoClose: 2500,
      });

      window.location.assign(`/${locale}/result`);
    } catch (e: any) {
      notifications.show({
        title: "Network error",
        message: e?.message ?? "Failed to reach server",
        color: "red",
        autoClose: 6000,
      });
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
            <Text c="dimmed" ta="center">
              {t("subtitle")}
            </Text>
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
                  onBlur={onBlurFirstName}
                  required
                  error={errors.firstName}
                />
                <TextInput
                  label={t("lastName")}
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.currentTarget.value)}
                  onBlur={onBlurLastName}
                  required
                  error={errors.lastName}
                />
              </Group>

              <Group grow>
                <Select
                  label={t("smoke")}
                  value={smoke}
                  onChange={(v) => {
                    const val = (v as Smoke) ?? null;
                    setSmoke(val);
                  }}
                  onBlur={() => setFieldError("smoke", validators.smoke(smoke))}
                  data={[
                    { value: "no", label: t("no") },
                    { value: "yes", label: t("yes") },
                  ]}
                  required
                  error={errors.smoke}
                />

                <NumberInput
                  label={t("cigarettes_per_day")}
                  value={cigarettesPerDay}
                  onChange={setCigarettesPerDay}
                  onBlur={onBlurCPD}
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
                  onBlur={onBlurHeight}
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
                  onBlur={onBlurWeight}
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
                onChange={(d) => {
                setDob(d);
                console.log("dob formatted: ", formatDDMMYYYY(d));
                setFieldError("dob", validators.dob(d));
              }}
                            valueFormat="DD.MM.YYYY"
                editable="false"          // boolean, not "false"
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
                        { value: "competitive", label: t("sport_competitive") },
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
