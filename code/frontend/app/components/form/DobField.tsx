"use client";

import { DatePickerInput } from "@mantine/dates";
import { yearsAgo } from "@/helpers/form/date";

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
    <DatePickerInput
      label={label}
      placeholder={placeholder}
      value={dob}
      onChange={(d) => { setDob(d); onValidate(d); }}
      valueFormat={valueFormat}
      editable="false"
      minDate={yearsAgo(100)}
      maxDate={yearsAgo(1)}
      clearable={false}
      error={error}
      required
    />
  );
}
