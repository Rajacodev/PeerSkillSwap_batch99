import { useEffect, useState, useCallback } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import skillService from "../services/skillService";
import bookingService from "../services/bookingService";
import reviewService from "../services/reviewService";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import UserAvatar from "../components/common/UserAvatar";
import RatingStars from "../components/common/RatingStars";
import CreditBadge from "../components/common/CreditBadge";
import BookingRequestDialog from "../components/bookings/BookingRequestDialog";
import getErrorMessage from "../utils/getErrorMessage";

export default function SkillDetails() {
  const { skillId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [skill, setSkill] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [skillRes, reviewRes] = await Promise.all([
        skillService.getById(skillId),
        reviewService.listForSkill(skillId, { per_page: 10 }),
      ]);
      setSkill(skillRes.data.data);
      setReviews(reviewRes.data.data);

      if (isAuthenticated) {
        try {
          const bookmarksRes = await skillService.listBookmarks({ per_page: 100 });
          setBookmarked(
            bookmarksRes.data.data.some((b) => b.skill?.id === skillId)
          );
        } catch {
          // non-critical — bookmark state just won't be pre-filled
        }
      }
    } finally {
      setLoading(false);
    }
  }, [skillId, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBookmarkToggle = async () => {
    try {
      if (bookmarked) {
        await skillService.removeBookmark(skillId);
        setBookmarked(false);
        enqueueSnackbar("Removed from bookmarks", { variant: "info" });
      } else {
        await skillService.addBookmark(skillId);
        setBookmarked(true);
        enqueueSnackbar("Bookmarked!", { variant: "success" });
      }
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    }
  };

  const handleBookSession = async (payload) => {
    setSubmitting(true);
    try {
      await bookingService.create(payload);
      enqueueSnackbar("Booking requested! Waiting for mentor confirmation.", {
        variant: "success",
      });
      setBookingOpen(false);
      navigate("/bookings");
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !skill) return <LoadingSpinner label="Loading skill…" />;

  const isOwnSkill = user?.id === skill.mentor?.id;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Chip label={skill.category} color="primary" variant="outlined" size="small" />
                {isAuthenticated && !isOwnSkill && (
                  <Tooltip title={bookmarked ? "Remove bookmark" : "Bookmark this skill"}>
                    <IconButton onClick={handleBookmarkToggle}>
                      {bookmarked ? <BookmarkRoundedIcon color="secondary" /> : <BookmarkBorderRoundedIcon />}
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              <Typography variant="h4" sx={{ mb: 1.5 }}>
                {skill.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
                {skill.description}
              </Typography>

              <Stack direction="row" spacing={3} flexWrap="wrap" mb={2.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ScheduleRoundedIcon fontSize="small" color="disabled" />
                  <Typography variant="body2">{skill.duration_minutes} minutes</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Cost:
                  </Typography>
                  <CreditBadge amount={skill.credits_per_session} size="small" />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Booked {skill.total_bookings} times
                  </Typography>
                </Stack>
              </Stack>

              {skill.tags?.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} mb={2.5}>
                  {skill.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Reviews ({reviews.length})
              </Typography>
              {reviews.length === 0 ? (
                <EmptyState title="No reviews yet" message="Be the first to book and review this skill." />
              ) : (
                <List disablePadding>
                  {reviews.map((review, idx) => (
                    <Box key={review.id}>
                      <ListItem disableGutters alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Typography variant="subtitle2">{review.reviewer?.name}</Typography>
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
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ position: "sticky", top: 88 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Your Mentor
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ my: 1.5 }}>
                <UserAvatar user={skill.mentor} size={52} />
                <Box>
                  <Typography
                    component={RouterLink}
                    to={`/profile/${skill.mentor?.id}`}
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: "text.primary", textDecoration: "none" }}
                  >
                    {skill.mentor?.name}
                  </Typography>
                  <RatingStars value={skill.mentor?.rating_average} />
                </Box>
              </Stack>
              {skill.mentor?.bio && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {skill.mentor.bio}
                </Typography>
              )}

              {isOwnSkill ? (
                <Chip label="This is your own skill" sx={{ width: "100%" }} />
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() =>
                    isAuthenticated ? setBookingOpen(true) : navigate("/login")
                  }
                >
                  Request Session
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <BookingRequestDialog
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSubmit={handleBookSession}
        skill={skill}
        submitting={submitting}
      />
    </Box>
  );
}
