"use client";

import { yearsAgo } from "@/helpers/form/date";
import { DateInput } from "@mantine/dates";

export default function DobField({
  dob,
  setDob,
  error,
  label,
  placeholder,
  onValidate,
  valueFormat = "DD.MM.YYYY",
}: {
  dob: Date | null;
  setDob: (d: Date | null) => void;
  error?: string;
  label: string;
  placeholder: string;
  onValidate: (d: Date | null) => void;
  valueFormat?: string;
}) {
  // Custom parser for DD.MM.YYYY
  const parseDate = (input: string): Date | null => {
    if (!input) return null;
    const parts = input.split(".");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map((p) => parseInt(p, 10));
    if (
      Number.isNaN(day) ||
      Number.isNaN(month) ||
      Number.isNaN(year) ||
      day < 1 ||
      month < 1 ||
      month > 12 ||
      year < 1900
    ) {
      return null;
    }
    const date = new Date(year, month - 1, day);
    // Ensure it matches what user typed (e.g. reject 31.02.2020)
    return date.getDate() === day && date.getMonth() === month - 1 ? date : null;
  };

  return (
    <DateInput
      label={label}
      placeholder={placeholder}
      value={dob}
      onChange={(d) => {
        setDob(d);
        onValidate(d);
      }}
      valueFormat={valueFormat}
      dateParser={parseDate} // ✅ key line
      minDate={yearsAgo(100)}
      maxDate={yearsAgo(1)}
      clearable={false}
      error={error}
      required
    />
  );
}
