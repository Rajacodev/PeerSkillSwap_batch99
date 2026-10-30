import { Chip } from "@mui/material";
import { BOOKING_STATUS_COLORS } from "../../utils/constants";
import { capitalize } from "../../utils/formatters";

export default function StatusChip({ status }) {
  return (
    <Chip
      label={capitalize(status)}
      color={BOOKING_STATUS_COLORS[status] || "default"}
      size="small"
      variant={status === "pending" ? "filled" : "outlined"}
    />
  );
}
