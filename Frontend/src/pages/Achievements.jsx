import { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardContent, Avatar, Stack } from "@mui/material";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import dashboardService from "../services/dashboardService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { formatDate } from "../utils/formatters";

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await dashboardService.getAchievements();
        if (mounted) setAchievements(data.data);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading achievements…" />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Achievements
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Badges you&apos;ve unlocked by teaching, learning, and earning great reviews.
      </Typography>

      {achievements.length === 0 ? (
        <EmptyState
          title="No badges yet"
          message="Complete your first session or receive your first review to unlock a badge."
          icon={MilitaryTechRoundedIcon}
        />
      ) : (
        <Grid container spacing={2.5}>
          {achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                    <Avatar
                      sx={{
                        width: 52,
                        height: 52,
                        background: (theme) =>
                          `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                      }}
                    >
                      <MilitaryTechRoundedIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {achievement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Earned {formatDate(achievement.earned_at)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {achievement.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
