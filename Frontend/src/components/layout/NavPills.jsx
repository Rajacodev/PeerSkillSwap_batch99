import { NavLink } from "react-router-dom";
import { Box } from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import useAuth from "../../hooks/useAuth";

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: DashboardRoundedIcon },
  { label: "Browse Skills", to: "/skills", icon: ExploreRoundedIcon },
  { label: "Career Advisor", to: "/career-advisor", icon: AutoAwesomeRoundedIcon },
  { label: "Bookmarks", to: "/bookmarks", icon: BookmarkRoundedIcon },
  { label: "Bookings", to: "/bookings", icon: EventNoteRoundedIcon },
  { label: "Wallet", to: "/wallet", icon: AccountBalanceWalletRoundedIcon },
  { label: "Leaderboard", to: "/leaderboard", icon: EmojiEventsRoundedIcon },
  { label: "Achievements", to: "/achievements", icon: MilitaryTechRoundedIcon },
];

export function getFullNavItems(user) {
  const items = [...NAV_ITEMS];
  if (user?.role === "mentor" || user?.role === "admin") {
    items.splice(2, 0, { label: "My Skills", to: "/skills/mine", icon: SchoolRoundedIcon });
  }
  if (user?.role === "admin") {
    items.push({ label: "Admin", to: "/admin", icon: AdminPanelSettingsRoundedIcon });
  }
  return items;
}

/**
 * Horizontal pill-style navigation for the top navbar — replaces the old
 * persistent sidebar. Active route gets a filled pill; others are plain
 * text that fills in with a soft hover background. Scrolls horizontally on
 * narrower desktop widths rather than wrapping or requiring a drawer.
 */
export default function NavPills() {
  const { user } = useAuth();
  const items = getFullNavItems(user);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        flexWrap: "nowrap",
      }}
    >
      {items.map((item) => (
        <Box
          key={item.to}
          component={NavLink}
          to={item.to}
          end={item.to === "/dashboard"}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.75,
            py: 0.85,
            borderRadius: 999,
            whiteSpace: "nowrap",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            color: "text.secondary",
            transition: "background-color 0.2s ease, color 0.2s ease, transform 0.15s ease",
            flexShrink: 0,
            "&:hover": {
              backgroundColor: "action.hover",
              color: "text.primary",
            },
            "&.active": {
              color: "primary.contrastText",
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              boxShadow: (theme) =>
                theme.palette.mode === "light"
                  ? "0 4px 12px -4px rgba(15,82,87,0.45)"
                  : "0 4px 12px -4px rgba(0,0,0,0.6)",
            },
          }}
        >
          <item.icon sx={{ fontSize: 18 }} />
          {item.label}
        </Box>
      ))}
    </Box>
  );
}
