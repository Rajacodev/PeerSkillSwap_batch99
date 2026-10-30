import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import dashboardService from "../services/dashboardService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import UserAvatar from "../components/common/UserAvatar";
import useAuth from "../hooks/useAuth";

const MEDAL_COLORS = ["#D4AF37", "#A8A9AD", "#B08D57"];

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await dashboardService.getLeaderboard(50, true);
        if (mounted) setEntries(data.data);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Tallying the scores…" />;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <EmojiEventsRoundedIcon color="secondary" fontSize="large" />
        <Typography variant="h4">Leaderboard</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ranked by sessions taught, sessions learned, and average rating.
      </Typography>

      {entries.length === 0 ? (
        <EmptyState title="No rankings yet" message="Complete a session to appear on the leaderboard." />
      ) : (
        <Card variant="outlined">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={60}>Rank</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="center">Taught</TableCell>
                  <TableCell align="center">Learned</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="right">Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, idx) => (
                  <TableRow
                    key={entry.user?.id}
                    sx={{
                      bgcolor:
                        entry.user?.id === user?.id ? "action.selected" : "transparent",
                    }}
                  >
                    <TableCell>
                      {idx < 3 ? (
                        <EmojiEventsRoundedIcon sx={{ color: MEDAL_COLORS[idx] }} />
                      ) : (
                        <Typography color="text.secondary">{idx + 1}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <UserAvatar user={entry.user} size={32} />
                        <Typography variant="body2">{entry.user?.name}</Typography>
                        {entry.user?.id === user?.id && (
                          <Chip label="You" size="small" color="primary" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">{entry.sessions_taught}</TableCell>
                    <TableCell align="center">{entry.sessions_learned}</TableCell>
                    <TableCell align="center">{entry.rating_average}</TableCell>
                    <TableCell align="right">
                      <strong>{entry.score}</strong>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
