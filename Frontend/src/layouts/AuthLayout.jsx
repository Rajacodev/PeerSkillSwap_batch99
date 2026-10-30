import { Outlet, Link as RouterLink } from "react-router-dom";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

export default function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: (theme) =>
          theme.palette.mode === "light"
            ? "radial-gradient(circle at 20% 20%, rgba(15,82,87,0.08), transparent 45%), radial-gradient(circle at 80% 80%, rgba(232,135,74,0.10), transparent 45%)"
            : "radial-gradient(circle at 20% 20%, rgba(79,189,191,0.08), transparent 45%), radial-gradient(circle at 80% 80%, rgba(240,149,92,0.08), transparent 45%)",
        py: 6,
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Stack alignItems="center" spacing={1} mb={3}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "text.primary",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                color: "#fff",
              }}
            >
              <SwapHorizRoundedIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
              PeerSkillSwap
            </Typography>
          </Box>
        </Stack>
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
