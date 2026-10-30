import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingSpinner({ label = "Loading…", fullHeight = true, size = 36 }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        py: 6,
        minHeight: fullHeight ? "40vh" : "auto",
      }}
    >
      <CircularProgress size={size} thickness={4} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}
