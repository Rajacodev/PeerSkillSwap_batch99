import { Rating, Box, Typography } from "@mui/material";

export default function RatingStars({ value = 0, count, size = "small" }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Rating value={Number(value) || 0} precision={0.5} readOnly size={size} />
      {typeof count === "number" && (
        <Typography variant="caption" color="text.secondary">
          ({count})
        </Typography>
      )}
    </Box>
  );
}
