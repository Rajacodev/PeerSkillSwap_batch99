/**
 * Custom MUI theme. Palette is built around the idea of "exchange": a deep
 * teal for trust/knowledge and a warm clay-orange for the credit economy,
 * rather than the default MUI blue/purple.
 */
import { createTheme } from "@mui/material/styles";

const shared = {
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
          transition: "transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease",
          "&:hover": {
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 8px 20px -6px rgba(0,0,0,0.35)",
          },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s ease",
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          "&:hover": {
            "& .MuiCardContent-root": {
              backgroundColor: "transparent",
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        },
        clickable: {
          "&:hover": { transform: "translateY(-1px)" },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "none" },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "transform 0.18s ease, background-color 0.18s ease",
          "&:hover": { transform: "scale(1.08)" },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition: "background-color 0.18s ease, padding-left 0.18s ease",
          "&:hover": { paddingLeft: 20 },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.15s ease",
        },
      },
    },
  },
};

export const getAppTheme = (mode) =>
  createTheme({
    ...shared,
    palette:
      mode === "dark"
        ? {
            mode: "dark",
            primary: { main: "#4FBDBF", contrastText: "#062024" },
            secondary: { main: "#F0955C" },
            background: { default: "#12181A", paper: "#1A2224" },
            success: { main: "#5FBF8F" },
            warning: { main: "#F0B15C" },
            error: { main: "#E2685F" },
            text: { primary: "#EDF3F3", secondary: "#A9BDBE" },
            divider: "rgba(237,243,243,0.10)",
          }
        : {
            mode: "light",
            primary: { main: "#0F5257", contrastText: "#FFFFFF" },
            secondary: { main: "#E8874A" },
            background: { default: "#FAF8F4", paper: "#FFFFFF" },
            success: { main: "#2E8B57" },
            warning: { main: "#C97A2E" },
            error: { main: "#C0392B" },
            text: { primary: "#152426", secondary: "#546A6C" },
            divider: "rgba(15,82,87,0.12)",
          },
  });
