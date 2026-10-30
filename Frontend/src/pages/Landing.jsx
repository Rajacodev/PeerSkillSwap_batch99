import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Grid,
  Card,
  CardContent,
  Avatar,
  Grow,
} from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import useAuth from "../hooks/useAuth";

const RING_ICONS = [
  { Icon: CodeRoundedIcon, angle: 0 },
  { Icon: MusicNoteRoundedIcon, angle: 72 },
  { Icon: LanguageRoundedIcon, angle: 144 },
  { Icon: PaletteRoundedIcon, angle: 216 },
  { Icon: SchoolRoundedIcon, angle: 288 },
];

const STEPS = [
  {
    title: "List a skill you know",
    body: "Coding, guitar, Spanish, watercolor — whatever you can teach, post it in minutes.",
    Icon: SchoolRoundedIcon,
  },
  {
    title: "Earn credits by teaching",
    body: "Every completed session pays you in credits instead of cash — no invoices, no fees.",
    Icon: AccountBalanceWalletRoundedIcon,
  },
  {
    title: "Spend credits to learn",
    body: "Use what you've earned to book sessions with other mentors on the platform.",
    Icon: SwapHorizRoundedIcon,
  },
  {
    title: "Build your reputation",
    body: "Reviews, ratings, and achievement badges make your growth visible to everyone.",
    Icon: EmojiEventsRoundedIcon,
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <Box>
      {/* HERO */}
      <Box
        sx={{
          background: (theme) =>
            theme.palette.mode === "light"
              ? "radial-gradient(circle at 15% 10%, rgba(15,82,87,0.07), transparent 45%), radial-gradient(circle at 85% 25%, rgba(232,135,74,0.10), transparent 40%)"
              : "radial-gradient(circle at 15% 10%, rgba(79,189,191,0.08), transparent 45%), radial-gradient(circle at 85% 25%, rgba(240,149,92,0.08), transparent 40%)",
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2.4rem", md: "3.2rem" },
                  lineHeight: 1.1,
                  letterSpacing: -1,
                  mb: 2,
                }}
              >
                Trade skills.
                <br />
                Not money.
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 4, maxWidth: 480 }}>
                PeerSkillSwap is a credit economy for learning: teach what you know to earn
                credits, then spend them to learn from someone else. No invoices, ever.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  component={RouterLink}
                  to={isAuthenticated ? "/dashboard" : "/register"}
                  variant="contained"
                  size="large"
                >
                  {isAuthenticated ? "Go to dashboard" : "Get started free"}
                </Button>
                <Button component={RouterLink} to="/skills" variant="outlined" size="large">
                  Browse skills
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: "relative",
                  width: { xs: 280, sm: 340 },
                  height: { xs: 280, sm: 340 },
                  mx: "auto",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "1.5px dashed",
                    borderColor: "divider",
                    animation: "spin 40s linear infinite",
                    "@keyframes spin": {
                      from: { transform: "rotate(0deg)" },
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />
                {RING_ICONS.map(({ Icon, angle }, i) => {
                  const radius = 140;
                  const rad = (angle * Math.PI) / 180;
                  const x = radius * Math.cos(rad);
                  const y = radius * Math.sin(rad);
                  return (
                    <Avatar
                      key={i}
                      sx={{
                        position: "absolute",
                        top: `calc(50% + ${y}px - 22px)`,
                        left: `calc(50% + ${x}px - 22px)`,
                        width: 44,
                        height: 44,
                        bgcolor: i % 2 === 0 ? "primary.main" : "secondary.main",
                      }}
                    >
                      <Icon fontSize="small" />
                    </Avatar>
                  );
                })}
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                    color: "#fff",
                    boxShadow: 6,
                  }}
                >
                  <SwapHorizRoundedIcon sx={{ fontSize: 48 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* HOW IT WORKS */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h4" sx={{ textAlign: "center", mb: 1 }}>
          How the exchange works
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", mb: 6, maxWidth: 560, mx: "auto" }}
        >
          Four simple moves keep the whole economy running — no bank account required.
        </Typography>
        <Grid container spacing={3}>
          {STEPS.map((step, i) => (
            <Grid item xs={12} sm={6} md={3} key={step.title}>
              <Grow in appear timeout={400 + i * 150}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    p: 1,
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    "&:hover": { transform: "translateY(-6px)", boxShadow: 5 },
                    "&:hover .step-icon": { transform: "rotate(-8deg) scale(1.1)" },
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                      <Avatar
                        className="step-icon"
                        sx={{
                          bgcolor: i % 2 === 0 ? "primary.main" : "secondary.main",
                          width: 36,
                          height: 36,
                          transition: "transform 0.3s ease",
                        }}
                      >
                        <step.Icon fontSize="small" />
                      </Avatar>
                      <Typography variant="overline" color="text.secondary">
                        Step {i + 1}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.body}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h4" sx={{ mb: 2, color: "inherit" }}>
            Your first 10 credits are on us
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Sign up free and book your first session today — teach one, learn one.
          </Typography>
          <Button
            component={RouterLink}
            to={isAuthenticated ? "/dashboard" : "/register"}
            variant="contained"
            size="large"
            color="secondary"
            sx={{
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": { transform: "translateY(-2px) scale(1.03)", boxShadow: 6 },
            }}
          >
            {isAuthenticated ? "Go to dashboard" : "Create your free account"}
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
