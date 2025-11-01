import { Smoke, SportEntry } from "./types";
import { parseLooseDob } from "./date";

export type PrefillPayload = Partial<{
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
  dob: string | null;

  sports: string[];
}>;

export function prefillNames(
  data: PrefillPayload,
  setFirstName: (v: string) => void,
  setLastName: (v: string) => void
): number {
  let applied = 0;
  if (data.first_name || data.firstName) {
    setFirstName((data.first_name ?? data.firstName ?? "").trim());
    applied++;
  }
  if (data.last_name || data.lastName) {
    setLastName((data.last_name ?? data.lastName ?? "").trim());
    applied++;
  }
  return applied;
}

export function prefillSmoking(
  data: PrefillPayload,
  setSmoke: (v: Smoke) => void
): number {
  let applied = 0;
  if (typeof data.smokes === "boolean") {
    setSmoke(data.smokes ? "yes" : "no");
    applied++;
  } else if (data.smoke === "yes" || data.smoke === "no") {
    setSmoke(data.smoke);
    applied++;
  }
  return applied;
}

export function prefillCPD(
  data: PrefillPayload,
  setCigarettesPerDay: (v: number | "") => void
): number {
  let applied = 0;
  if (data.cigarettes_per_day != null) {
    setCigarettesPerDay(Number(data.cigarettes_per_day));
    applied++;
  } else if (data.cigarettesPerDay != null) {
    setCigarettesPerDay(Number(data.cigarettesPerDay));
    applied++;
  }
  return applied;
}

export function prefillMetrics(
  data: PrefillPayload,
  setHeight: (v: number | "") => void,
  setWeight: (v: number | "") => void
): number {
  let applied = 0;
  if (data.height_cm != null) { setHeight(Number(data.height_cm)); applied++; }
  else if (data.height != null) { setHeight(Number(data.height)); applied++; }

  if (data.weight_kg != null) { setWeight(Number(data.weight_kg)); applied++; }
  else if (data.weight != null) { setWeight(Number(data.weight)); applied++; }

  return applied;
}

export function prefillSports(
  data: PrefillPayload,
  setSports: (v: SportEntry[]) => void
): number {
  let applied = 0;
  if (Array.isArray(data.sports) && data.sports.length > 0) {
    setSports(data.sports.map((name) => ({ name, level: "hobby" as const })));
    applied++;
  }
  return applied;
}

export function prefillDob(
  data: PrefillPayload,
  setDob: (d: Date | null) => void
): number {
  const rawDob = data.date_of_birth ?? data.dob;
  if (!rawDob) return 0;
  const parsed = parseLooseDob(rawDob);
  if (parsed) {
    setDob(parsed);
    return 1;
  }
  return 0;
}

export function prefillAll(params: {
  data: PrefillPayload;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setSmoke: (v: Smoke) => void;
  setCigarettesPerDay: (v: number | "") => void;
  setHeight: (v: number | "") => void;
  setWeight: (v: number | "") => void;
  setDob: (d: Date | null) => void;
  setSports: (v: SportEntry[]) => void;
}): number {
  const {
    data,
    setFirstName, setLastName,
    setSmoke, setCigarettesPerDay,
    setHeight, setWeight,
    setDob, setSports,
  } = params;

  let applied = 0;
  applied += prefillNames(data, setFirstName, setLastName);
  applied += prefillSmoking(data, setSmoke);
  applied += prefillCPD(data, setCigarettesPerDay);
  applied += prefillMetrics(data, setHeight, setWeight);
  applied += prefillDob(data, setDob);
  applied += prefillSports(data, setSports);
  return applied;
}
