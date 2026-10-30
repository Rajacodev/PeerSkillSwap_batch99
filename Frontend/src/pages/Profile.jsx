import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import userService from "../services/userService";
import reviewService from "../services/reviewService";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import UserAvatar from "../components/common/UserAvatar";
import RatingStars from "../components/common/RatingStars";
import { formatDate } from "../utils/formatters";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const targetId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const profileRes = isOwnProfile
          ? await userService.getMe()
          : await userService.getPublicProfile(targetId);
        if (!mounted) return;
        setProfile(profileRes.data.data);

        if (profileRes.data.data.role === "mentor") {
          const reviewRes = await reviewService.listForMentor(profileRes.data.data.id, {
            per_page: 10,
          });
          if (mounted) setReviews(reviewRes.data.data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (targetId) load();
    return () => {
      mounted = false;
    };
  }, [targetId, isOwnProfile]);

  if (loading || !profile) return <LoadingSpinner label="Loading profile…" />;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <UserAvatar user={profile} size={84} />
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                <Typography variant="h5">{profile.name}</Typography>
                <Chip
                  label={profile.role}
                  size="small"
                  color={profile.role === "mentor" ? "secondary" : "primary"}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Member since {formatDate(profile.created_at)}
              </Typography>
              {profile.role === "mentor" && (
                <RatingStars value={profile.rating_average} />
              )}
            </Box>
            {isOwnProfile && (
              <Button
                component={RouterLink}
                to="/profile/edit"
                variant="outlined"
                startIcon={<EditRoundedIcon />}
              >
                Edit Profile
              </Button>
            )}
          </Stack>

          {profile.bio && (
            <Typography variant="body1" sx={{ mt: 2.5 }}>
              {profile.bio}
            </Typography>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
              <Typography variant="h6">{profile.total_sessions_taught}</Typography>
              <Typography variant="caption" color="text.secondary">
                Sessions Taught
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h6">{profile.total_sessions_learned}</Typography>
              <Typography variant="caption" color="text.secondary">
                Sessions Learned
              </Typography>
            </Grid>
          </Grid>

          {(profile.skills_offered?.length > 0 || profile.skills_wanted?.length > 0) && (
            <Divider sx={{ my: 2.5 }} />
          )}

          {profile.skills_offered?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Skills offered
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {profile.skills_offered.map((s) => (
                  <Chip key={s} label={s} size="small" />
                ))}
              </Stack>
            </Box>
          )}
          {profile.skills_wanted?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Skills wanted
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {profile.skills_wanted.map((s) => (
                  <Chip key={s} label={s} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {profile.role === "mentor" && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Reviews
            </Typography>
            {reviews.length === 0 ? (
              <EmptyState title="No reviews yet" message="This mentor hasn't been reviewed yet." />
            ) : (
              <List disablePadding>
                {reviews.map((review, idx) => (
                  <Box key={review.id}>
                    <ListItem disableGutters alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Typography variant="subtitle2">
                              {review.reviewer?.name}
                            </Typography>
                            <RatingStars value={review.rating} />
                          </Stack>
                        }
                        secondary={review.comment}
                      />
                    </ListItem>
                    {idx < reviews.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
