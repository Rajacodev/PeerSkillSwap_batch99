import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Button,
  Chip,
  Alert,
  Skeleton,
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import dashboardService from "../services/dashboardService";
import skillService from "../services/skillService";
import useAuth from "../hooks/useAuth";
import SkillCard from "../components/skills/SkillCard";
import CreditBadge from "../components/common/CreditBadge";
import getErrorMessage from "../utils/getErrorMessage";

const STAT_CARDS = [
  { key: "total_sessions_taught", label: "Sessions Taught", Icon: SchoolRoundedIcon, color: "primary.main" },
  { key: "total_sessions_learned", label: "Sessions Learned", Icon: MenuBookRoundedIcon, color: "secondary.main" },
  { key: "pending_bookings_as_mentor", label: "Pending Requests", Icon: HourglassTopRoundedIcon, color: "warning.main" },
  { key: "upcoming_bookings_as_student", label: "Upcoming Sessions", Icon: EventAvailableRoundedIcon, color: "success.main" },
];

function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={280} height={44} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={360} height={24} sx={{ mb: 3 }} />
      <Grid container spacing={2.5} mb={4}>
        {[...Array(5)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4 }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="text" width={220} height={32} sx={{ mb: 2 }} />
      <Grid container spacing={2.5}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: 4 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [dashRes, recRes] = await Promise.all([
          dashboardService.getMyDashboard(),
          skillService.recommended(4),
        ]);
        if (mounted) {
          setDashboard(dashRes.data.data);
          setRecommended(recRes.data.data);
        }
      } catch (err) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !dashboard) {
    return (
      <Alert severity="error" sx={{ maxWidth: 560 }}>
        Couldn&apos;t load your dashboard{error ? `: ${error}` : ""}. Please try refreshing the
        page.
      </Alert>
    );
  }

  const { stats, wallet } = dashboard;

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h4">Welcome back, {user?.name?.split(" ")[0]}</Typography>
          <Typography variant="body2" color="text.secondary">
            Here&apos;s what&apos;s happening with your skill exchange.
          </Typography>
        </Box>
        <Chip
          icon={<StarRoundedIcon />}
          label={`${stats.rating_average || 0} average rating`}
          color="primary"
          variant="outlined"
        />
      </Stack>

      <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
              "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                <Avatar sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}>
                  <AccountBalanceWalletRoundedIcon fontSize="small" />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  Wallet Balance
                </Typography>
              </Stack>
              <CreditBadge amount={wallet.balance} size="large" />
              <Button component={RouterLink} to="/wallet" size="small" sx={{ mt: 1.5 }}>
                View wallet
              </Button>
            </CardContent>
          </Card>
        </Grid>
        {STAT_CARDS.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.key}>
            <Card
              variant="outlined"
              sx={{
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                  <Avatar sx={{ bgcolor: card.color, width: 36, height: 36 }}>
                    <card.Icon fontSize="small" />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                </Stack>
                <Typography variant="h4">{stats[card.key]}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card
        variant="outlined"
        sx={{
          mb: 4,
          background: (theme) =>
            theme.palette.mode === "light"
              ? "linear-gradient(135deg, rgba(232,135,74,0.08), rgba(15,82,87,0.08))"
              : "linear-gradient(135deg, rgba(240,149,92,0.08), rgba(79,189,191,0.08))",
        }}
      >
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                }}
              >
                <AutoAwesomeRoundedIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Not sure what to learn next?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tell our AI Career Advisor the job you want, and get a tailored skill path.
                </Typography>
              </Box>
            </Stack>
            <Button component={RouterLink} to="/career-advisor" variant="contained" sx={{ flexShrink: 0 }}>
              Try Career Advisor
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Recommended for you</Typography>
        <Button component={RouterLink} to="/skills" size="small">
          Browse all
        </Button>
      </Stack>
      <Grid container spacing={2.5}>
        {recommended.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary">
              Add skills you&apos;d like to learn in your profile to get tailored recommendations.
            </Typography>
          </Grid>
        )}
        {recommended.map((skill) => (
          <Grid item xs={12} sm={6} md={3} key={skill.id}>
            <SkillCard skill={skill} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
