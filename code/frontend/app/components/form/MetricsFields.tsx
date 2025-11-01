"use client";

import { Group, NumberInput } from "@mantine/core";

export default function MetricsFields({
  height, setHeight, weight, setWeight, errors,
  labelHeight, labelWeight, onBlurWeight, onBlurHeight
}: {
  height: number | ""; setHeight: (v: number | "") => void;
  weight: number | ""; setWeight: (v: number | "") => void;
  onBlurHeight: () => void;
  onBlurWeight: () => void;
  labelHeight: string; labelWeight: string;
}) {
  return (
    <Group grow>
      <NumberInput
        label={labelHeight}
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
        label={labelWeight}
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
  );
}
