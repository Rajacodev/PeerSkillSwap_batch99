import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Avatar,
  Stack,
  Button,
  Divider,
} from "@mui/material";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import notificationService from "../services/notificationService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import PaginationBar from "../components/common/PaginationBar";
import { formatDateTime } from "../utils/formatters";

const ICON_MAP = {
  booking_request: EventNoteRoundedIcon,
  booking_accepted: EventNoteRoundedIcon,
  booking_rejected: EventNoteRoundedIcon,
  booking_completed: EventNoteRoundedIcon,
  booking_cancelled: EventNoteRoundedIcon,
  new_review: StarRoundedIcon,
  credit_earned: AccountBalanceWalletRoundedIcon,
  credit_spent: AccountBalanceWalletRoundedIcon,
  achievement_unlocked: MilitaryTechRoundedIcon,
  system: NotificationsRoundedIcon,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationService.list({ page, per_page: 15 });
      setNotifications(data.data);
      setTotalPages(data.meta.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return;
    await notificationService.markRead(notification.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Notifications</Typography>
        <Button size="small" onClick={handleMarkAllRead}>
          Mark all as read
        </Button>
      </Stack>

      {loading ? (
        <LoadingSpinner label="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <EmptyState title="You're all caught up" message="New notifications will appear here." />
      ) : (
        <>
          <List disablePadding sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
            {notifications.map((notification, idx) => {
              const Icon = ICON_MAP[notification.type] || NotificationsRoundedIcon;
              return (
                <Box key={notification.id}>
                  <ListItemButton
                    onClick={() => handleMarkRead(notification)}
                    sx={{
                      bgcolor: notification.is_read ? "transparent" : "action.hover",
                      py: 1.5,
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                        <Icon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <>
                          {notification.message}
                          <br />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {formatDateTime(notification.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                  {idx < notifications.length - 1 && <Divider component="li" />}
                </Box>
              );
            })}
          </List>
          <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </Box>
  );
}
