"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const repeat = (hex: string) =>
  Array(10).fill(hex) as [string,string,string,string,string,string,string,string,string,string];

export const paxTheme = createTheme({
  primaryColor: "pax",
  primaryShade: { light: 5, dark: 5 },
  colors: {
    pax: repeat("#413c59"),
    paxGreen: repeat("#a5c405"),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={paxTheme} forceColorScheme="light">
      <Notifications position="top-right" zIndex={4000} />
      {children}
    </MantineProvider>
  );
}
