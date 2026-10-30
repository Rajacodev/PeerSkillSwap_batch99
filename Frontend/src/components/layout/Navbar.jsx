import { useEffect, useState, useCallback } from "react";
import { Link as RouterLink, NavLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Button,
  Tooltip,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import useAuth from "../../hooks/useAuth";
import useThemeMode from "../../hooks/useThemeMode";
import UserAvatar from "../common/UserAvatar";
import notificationService from "../../services/notificationService";
import NavPills, { getFullNavItems } from "./NavPills";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [mobileNavAnchor, setMobileNavAnchor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await notificationService.unreadCount();
      setUnreadCount(data.data.unread_count);
    } catch {
      // silent — badge just won't update this cycle
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [loadUnread]);

  const handleLogout = async () => {
    setAccountAnchor(null);
    await logout();
    navigate("/login");
  };

  const mobileNavItems = getFullNavItems(user);

  return (
    <AppBar
      position="sticky"
      color="default"
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === "light"
            ? "rgba(255,255,255,0.85)"
            : "rgba(26,34,36,0.85)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            color: "text.primary",
            mr: 1,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              color: "#fff",
            }}
          >
            <SwapHorizRoundedIcon fontSize="small" />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, letterSpacing: -0.5, display: { xs: "none", sm: "block" } }}
          >
            PeerSkillSwap
          </Typography>
        </Box>

        {isAuthenticated && (
          <Box sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1, minWidth: 0 }}>
            <NavPills />
          </Box>
        )}

        <Box sx={{ flexGrow: 1, display: { xs: "block", md: isAuthenticated ? "none" : "block" } }} />

        {isAuthenticated && (
          <IconButton
            onClick={(e) => setMobileNavAnchor(e.currentTarget)}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>
        )}
        <Menu
          anchorEl={mobileNavAnchor}
          open={Boolean(mobileNavAnchor)}
          onClose={() => setMobileNavAnchor(null)}
        >
          {mobileNavItems.map((item) => (
            <MenuItem
              key={item.to}
              component={NavLink}
              to={item.to}
              onClick={() => setMobileNavAnchor(null)}
              sx={{ "&.active": { bgcolor: "action.selected", fontWeight: 600 } }}
            >
              <ListItemIcon>
                <item.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>

        <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
          <IconButton onClick={toggleMode}>
            {mode === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
          </IconButton>
        </Tooltip>

        {isAuthenticated ? (
          <>
            <Tooltip title="Notifications">
              <IconButton onClick={() => navigate("/notifications")}>
                <Badge badgeContent={unreadCount} color="secondary" max={99}>
                  <NotificationsRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <IconButton onClick={(e) => setAccountAnchor(e.currentTarget)} sx={{ ml: 0.5 }}>
              <UserAvatar user={user} size={34} />
            </IconButton>
            <Menu
              anchorEl={accountAnchor}
              open={Boolean(accountAnchor)}
              onClose={() => setAccountAnchor(null)}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem
                onClick={() => {
                  setAccountAnchor(null);
                  navigate("/profile");
                }}
              >
                <ListItemIcon>
                  <PersonRoundedIcon fontSize="small" />
                </ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button component={RouterLink} to="/login" color="inherit">
              Log in
            </Button>
            <Button component={RouterLink} to="/register" variant="contained">
              Get started
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
