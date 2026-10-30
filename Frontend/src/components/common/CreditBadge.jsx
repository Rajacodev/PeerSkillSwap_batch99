import { Box, Typography } from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

/**
 * Signature visual element: a small circular "coin" badge used wherever
 * credits appear (wallet, skill cards, booking confirmations), reinforcing
 * the platform's central idea — skills as currency.
 */
export default function CreditBadge({ amount, size = "medium" }) {
  const dims = size === "small" ? 22 : size === "large" ? 40 : 28;
  const fontSize = size === "small" ? 12 : size === "large" ? 18 : 13;

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Box
        sx={{
          width: dims,
          height: dims,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <SwapHorizRoundedIcon sx={{ fontSize: dims * 0.6 }} />
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize }}>{amount}</Typography>
    </Box>
  );
}
