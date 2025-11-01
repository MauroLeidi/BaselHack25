"use client";

import { yearsAgo } from "@/helpers/form/date";
import { DateInput } from "@mantine/dates";

export default function DobField({
  dob, setDob, error, label, placeholder, onValidate,
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
  return (
    <DateInput
      label={label}
      placeholder={placeholder}
      value={dob}
      onChange={(d) => { setDob(d); onValidate(d); }}
      valueFormat={valueFormat}
      minDate={yearsAgo(100)}
      maxDate={yearsAgo(1)}
      clearable={false}
      error={error}
      required
    />
  );
}
