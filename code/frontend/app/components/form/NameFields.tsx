"use client";

import { Group, TextInput } from "@mantine/core";

export default function NameFields({
  firstName, lastName,
  setFirstName, setLastName,
  errors, onBlurFirstName, onBlurLastName,
  labelFirst, labelLast, placeholderFirst = "Jane", placeholderLast = "Doe",
}: {
  firstName: string; lastName: string;
  setFirstName: (v: string) => void; setLastName: (v: string) => void;
  errors: Record<string, string>;
  onBlurFirstName: () => void; onBlurLastName: () => void;
  labelFirst: string; labelLast: string;
  placeholderFirst?: string; placeholderLast?: string;
}) {
  return (
    <Group grow>
      <TextInput
        label={labelFirst}
        placeholder={placeholderFirst}
        value={firstName}
        onChange={(e) => setFirstName(e.currentTarget.value)}
        onBlur={onBlurFirstName}
        required
        error={errors.firstName}
      />
      <TextInput
        label={labelLast}
        placeholder={placeholderLast}
        value={lastName}
        onChange={(e) => setLastName(e.currentTarget.value)}
        onBlur={onBlurLastName}
        required
        error={errors.lastName}
      />
    </Group>
  );
}
