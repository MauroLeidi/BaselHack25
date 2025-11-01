import { NAME_REGEX, Smoke } from "./types";
import { yearsAgo } from "./date";

export const makeValidators = (t: (k: string) => string) => ({
  firstName: (v: string) => {
    const val = v.trim();
    if (!val) return t("errors.first_name_required");
    if (!NAME_REGEX.test(val)) return t("errors.name_invalid");
    return null;
  },
  lastName: (v: string) => {
    const val = v.trim();
    if (!val) return t("errors.last_name_required");
    if (!NAME_REGEX.test(val)) return t("errors.name_invalid");
    return null;
  },
  smoke: (v: Smoke) => (v === null ? t("errors.smoke_required") : null),
  cigarettesPerDay: (v: number | "", smoker: boolean) => {
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
  dob: (v: Date | null) => {
    if (!v) return t("errors.dob_required");
    const now = new Date();
    const minDob = yearsAgo(100);
    const maxDob = yearsAgo(1);
    if (v > now) return t("errors.dob_future");
    if (v < minDob) return t("errors.age_max");
    if (v > maxDob) return t("errors.age_min_exact");
    return null;
  },
});
