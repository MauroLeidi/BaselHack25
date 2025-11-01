"use client";

import { Group, NumberInput, Select } from "@mantine/core";
import { Smoke } from "@/lib/form/types";

export default function SmokingFields({
  smoke, setSmoke,
  cigarettesPerDay, setCigarettesPerDay,
  isSmoker, errors, onBlurCPD,
  labelSmoke, labelYes, labelNo, labelCPD,
}: {
  smoke: Smoke; setSmoke: (v: Smoke) => void;
  cigarettesPerDay: number | ""; setCigarettesPerDay: (v: number | "") => void;
  isSmoker: boolean; errors: Record<string, string>;
  onBlurCPD: () => void;
  labelSmoke: string; labelYes: string; labelNo: string; labelCPD: string;
}) {
  return (
    <Group grow>
      <Select
        label={labelSmoke}
        value={smoke}
        onChange={(v) => setSmoke((v as Smoke) ?? null)}
        data={[
          { value: "no", label: labelNo },
          { value: "yes", label: labelYes },
        ]}
        required
        error={errors.smoke}
      />

      <NumberInput
        label={labelCPD}
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
  );
}
