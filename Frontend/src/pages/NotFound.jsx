import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Button, Stack } from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
          color: "#fff",
          mb: 3,
        }}
      >
        <SwapHorizRoundedIcon sx={{ fontSize: 40 }} />
      </Box>
      <Typography variant="h2" sx={{ fontSize: "4rem", mb: 1 }}>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        This page doesn&apos;t exist — maybe it was traded away.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button component={RouterLink} to="/" variant="contained">
          Back to home
        </Button>
        <Button component={RouterLink} to="/skills" variant="outlined">
          Browse skills
        </Button>
      </Stack>
    </Box>
  );
}
