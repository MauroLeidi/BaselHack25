"use client";

import { ActionIcon, Autocomplete, Button, Group, Select, Stack } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Level, SportEntry } from "@/lib/form/types";

const DEFAULT_SUGGESTIONS = [
  "Basketball","Football","Running","Cycling","Swimming","Climbing",
  "Skiing","Snowboarding","Martial arts","Diving","Paragliding","Motorsport",
  "Rugby","Tennis",
];

export default function SportsSection({
  sports, setSports,
  labelSection, labelName, placeholderName, labelLevel, labelHobby, labelCompetitive, labelAdd, labelRemove,
  suggestions = DEFAULT_SUGGESTIONS,
}: {
  sports: SportEntry[];
  setSports: (v: SportEntry[]) => void;
  labelSection: string; labelName: string; placeholderName: string;
  labelLevel: string; labelHobby: string; labelCompetitive: string;
  labelAdd: string; labelRemove: string;
  suggestions?: string[];
}) {
  function addSport() {
    setSports([...sports, { name: "", level: "hobby" }]);
  }
  function removeSport(i: number) {
    setSports(sports.filter((_, idx) => idx !== i));
  }
  function updateSport(i: number, patch: Partial<SportEntry>) {
    setSports(sports.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  return (
    <Stack gap="sm">
      {sports.map((row, i) => (
        <Group key={i} align="end" wrap="nowrap">
          <Autocomplete
            label={labelName}
            placeholder={placeholderName}
            data={suggestions}
            value={row.name}
            onChange={(v) => updateSport(i, { name: v })}
            w="100%"
          />
          <Select
            label={labelLevel}
            value={row.level}
            onChange={(v) => updateSport(i, { level: (v as Level) ?? "hobby" })}
            data={[
              { value: "hobby", label: labelHobby },
              { value: "competitive", label: labelCompetitive },
            ]}
            w={220}
          />
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={labelRemove}
            onClick={() => removeSport(i)}
            disabled={sports.length === 1}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      ))}

      <Button leftSection={<IconPlus size={16} />} variant="light" onClick={addSport} maw={220}>
        {labelAdd}
      </Button>
    </Stack>
  );
}
