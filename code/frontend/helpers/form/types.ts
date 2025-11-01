export type Smoke = "yes" | "no" | null;
export type Level = "hobby" | "competitive";
export type SportEntry = { name: string; level: Level };

export type Errors = Record<string, string>;

export const NAME_REGEX = /^\p{L}+(?:[ '\-]\p{L}+)*$/u;
