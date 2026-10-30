import { Avatar } from "@mui/material";
import { initials } from "../../utils/formatters";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export default function UserAvatar({ user, size = 40, sx = {} }) {
  const src = user?.profile_picture ? `${API_ORIGIN}${user.profile_picture}` : undefined;
  return (
    <Avatar
      src={src}
      sx={{
        width: size,
        height: size,
        bgcolor: "secondary.main",
        fontSize: size * 0.4,
        ...sx,
      }}
    >
      {!src && initials(user?.name || "?")}
    </Avatar>
  );
}
