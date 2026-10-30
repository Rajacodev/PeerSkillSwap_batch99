import { useCallback, useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  TextField,
  Alert,
} from "@mui/material";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import dashboardService from "../services/dashboardService";
import adminService from "../services/adminService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PaginationBar from "../components/common/PaginationBar";
import StatusChip from "../components/common/StatusChip";
import UserAvatar from "../components/common/UserAvatar";
import useDebounce from "../hooks/useDebounce";
import getErrorMessage from "../utils/getErrorMessage";
import { formatDate } from "../utils/formatters";

const STAT_TILES = [
  { key: "total_users", label: "Total Users", Icon: GroupRoundedIcon, color: "primary.main" },
  { key: "total_skills", label: "Total Skills", Icon: SchoolRoundedIcon, color: "secondary.main" },
  { key: "completed_bookings", label: "Completed Sessions", Icon: EventNoteRoundedIcon, color: "success.main" },
  { key: "total_reviews", label: "Total Reviews", Icon: StarRoundedIcon, color: "warning.main" },
  {
    key: "total_credits_in_circulation",
    label: "Credits in Circulation",
    Icon: AccountBalanceWalletRoundedIcon,
    color: "info.main",
  },
];

export default function AdminDashboard() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let mounted = true;
    dashboardService
      .getAdminDashboard()
      .then(({ data }) => mounted && setStats(data.data))
      .catch((err) => mounted && setStatsError(getErrorMessage(err)))
      .finally(() => mounted && setLoadingStats(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Platform-wide analytics and moderation tools.
      </Typography>

      {loadingStats ? (
        <LoadingSpinner label="Loading platform stats…" />
      ) : statsError || !stats ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          Couldn&apos;t load platform stats{statsError ? `: ${statsError}` : ""}.
        </Alert>
      ) : (
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {STAT_TILES.map((tile) => (
            <Grid item xs={12} sm={6} md={2.4} key={tile.key}>
              <Card
                variant="outlined"
                sx={{
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                    <Avatar sx={{ bgcolor: tile.color, width: 34, height: 34 }}>
                      <tile.Icon fontSize="small" />
                    </Avatar>
                  </Stack>
                  <Typography variant="h5">{stats[tile.key]}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tile.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Users" value="overview" />
        <Tab label="Skills" value="skills" />
        <Tab label="Bookings" value="bookings" />
      </Tabs>

      {tab === "overview" && <UsersTab enqueueSnackbar={enqueueSnackbar} />}
      {tab === "skills" && <SkillsTab enqueueSnackbar={enqueueSnackbar} />}
      {tab === "bookings" && <BookingsTab />}
    </Box>
  );
}

function UsersTab({ enqueueSnackbar }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.listUsers({ page, per_page: 10, search: debouncedSearch });
      setUsers(data.data);
      setTotalPages(data.meta.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (user) => {
    try {
      await adminService.setUserActive(user.id, !user.is_active);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !user.is_active } : u))
      );
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <TextField
          size="small"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, width: 280 }}
        />
        {loading ? (
          <LoadingSpinner label="Loading users…" />
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <UserAvatar user={u} size={30} />
                          <Box>
                            <Typography variant="body2">{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {u.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={u.role} size="small" />
                      </TableCell>
                      <TableCell>{formatDate(u.created_at)}</TableCell>
                      <TableCell align="right">
                        <Switch checked={u.is_active} onChange={() => toggleActive(u)} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SkillsTab({ enqueueSnackbar }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [skills, setSkills] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.listSkills({ page, per_page: 10, search: debouncedSearch });
      setSkills(data.data);
      setTotalPages(data.meta.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (skill) => {
    try {
      await adminService.setSkillActive(skill.id, !skill.is_active);
      setSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? { ...s, is_active: !skill.is_active } : s))
      );
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <TextField
          size="small"
          placeholder="Search skills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, width: 280 }}
        />
        {loading ? (
          <LoadingSpinner label="Loading skills…" />
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Mentor</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Live</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {skills.map((skill) => (
                    <TableRow key={skill.id}>
                      <TableCell>{skill.title}</TableCell>
                      <TableCell>{skill.mentor?.name}</TableCell>
                      <TableCell>
                        <Chip label={skill.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Switch checked={skill.is_active} onChange={() => toggleActive(skill)} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.listBookings({ page, per_page: 10 });
      setBookings(data.data);
      setTotalPages(data.meta.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card variant="outlined">
      <CardContent>
        {loading ? (
          <LoadingSpinner label="Loading bookings…" />
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Mentor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Credits</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.skill?.title}</TableCell>
                      <TableCell>{booking.student?.name}</TableCell>
                      <TableCell>{booking.mentor?.name}</TableCell>
                      <TableCell>
                        <StatusChip status={booking.status} />
                      </TableCell>
                      <TableCell align="right">{booking.credits_charged}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
