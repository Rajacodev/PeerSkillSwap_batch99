import { Box, Typography, Button } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

export default function EmptyState({
  title = "Nothing here yet",
  message = "",
  actionLabel,
  onAction,
  icon: Icon = InboxOutlinedIcon,
}) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        px: 3,
        color: "text.secondary",
      }}
    >
      <Icon sx={{ fontSize: 56, opacity: 0.4, mb: 1 }} />
      <Typography variant="h6" color="text.primary" gutterBottom>
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" sx={{ maxWidth: 420, mx: "auto", mb: actionLabel ? 3 : 0 }}>
          {message}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
