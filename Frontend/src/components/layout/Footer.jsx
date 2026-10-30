import { Box, Container, Typography, Link, Stack } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        py: 3,
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} PeerSkillSwap. Trade skills, not money.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Link href="#" underline="hover" variant="body2" color="text.secondary">
              About
            </Link>
            <Link href="#" underline="hover" variant="body2" color="text.secondary">
              Privacy
            </Link>
            <Link href="#" underline="hover" variant="body2" color="text.secondary">
              Terms
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
