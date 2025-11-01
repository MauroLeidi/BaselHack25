import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';
import '@mantine/dates/styles.css';

import { MantineProvider, ColorSchemeScript, createTheme } from '@mantine/core';

const paxTheme = createTheme({
  primaryColor: "pax",
  colors: {
    pax: [
      "#ede9ff", 
      "#dcd4ff", 
      "#b7a8ff", 
      "#8b77ff", 
      "#5e44ff", 
      "#4c30e6", 
      "#3b24b4", 
      "#291982", 
      "#170e50", 
      "#0a0626",
    ],
    paxGreen: [
      "#e6fff3",
      "#c4f7da",
      "#90e8b9",
      "#57d493",
      "#24ba6f", 
      "#1fa25f",
      "#177c49",
      "#105735",
      "#083322",
      "#021910"
    ],
  },

  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",

  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px"
  }
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mantine-color-scheme="light">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={paxTheme} forceColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
