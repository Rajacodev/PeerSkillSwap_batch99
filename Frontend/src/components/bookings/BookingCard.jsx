import { Card, CardContent, Stack, Typography, Box, Button, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import UserAvatar from "../common/UserAvatar";
import StatusChip from "../common/StatusChip";
import CreditBadge from "../common/CreditBadge";
import { formatDateTime } from "../../utils/formatters";

export default function BookingCard({
  booking,
  viewAs,
  onAccept,
  onReject,
  onComplete,
  onCancel,
  onReview,
  onEditMeetingLink,
}) {
  const otherParty = viewAs === "mentor" ? booking.student : booking.mentor;
  const canHaveMeetingLink = ["accepted", "completed"].includes(booking.status);

  return (
    <Card
      variant="outlined"
      sx={{
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 3 },
      }}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          mb={1.5}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {booking.skill?.title}
          </Typography>
          <StatusChip status={booking.status} />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
          <UserAvatar user={otherParty} size={32} />
          <Box>
            <Typography variant="body2">
              {viewAs === "mentor" ? "Student: " : "Mentor: "}
              <strong>{otherParty?.name}</strong>
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <EventRoundedIcon fontSize="small" color="disabled" />
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(booking.scheduled_at)}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Typography variant="body2" color="text.secondary">
            Cost:
          </Typography>
          <CreditBadge amount={booking.credits_charged} size="small" />
        </Stack>

        {canHaveMeetingLink && (
          <Stack direction="row" alignItems="center" spacing={1} mb={1} flexWrap="wrap">
            {booking.meeting_link ? (
              <Link
                href={booking.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontWeight: 600 }}
              >
                Join Meeting
              </Link>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {viewAs === "mentor" ? "No meeting link set yet" : "Mentor hasn't shared a link yet"}
              </Typography>
            )}
            {viewAs === "mentor" && onEditMeetingLink && (
              <Button
                size="small"
                startIcon={<EditRoundedIcon fontSize="small" />}
                onClick={() => onEditMeetingLink(booking)}
                sx={{ minWidth: 0 }}
              >
                {booking.meeting_link ? "Edit link" : "Add link"}
              </Button>
            )}
          </Stack>
        )}

        {booking.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mb: 1 }}>
            &ldquo;{booking.notes}&rdquo;
          </Typography>
        )}

        {booking.cancellation_reason && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            Reason: {booking.cancellation_reason}
          </Typography>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
          {booking.status === "accepted" && (
            <Button
              size="small"
              variant="contained"
              color="secondary"
              startIcon={<VideocamRoundedIcon fontSize="small" />}
              component={RouterLink}
              to={`/bookings/${booking.id}/call`}
            >
              Start Video Call
            </Button>
          )}
          {viewAs === "mentor" && booking.status === "pending" && (
            <>
              <Button size="small" variant="contained" onClick={() => onAccept?.(booking)}>
                Accept
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => onReject?.(booking)}>
                Reject
              </Button>
            </>
          )}
          {viewAs === "mentor" && booking.status === "accepted" && (
            <Button size="small" variant="contained" color="success" onClick={() => onComplete?.(booking)}>
              Mark Completed
            </Button>
          )}
          {["pending", "accepted"].includes(booking.status) && (
            <Button size="small" color="inherit" onClick={() => onCancel?.(booking)}>
              Cancel
            </Button>
          )}
          {viewAs === "student" && booking.status === "completed" && onReview && (
            <Button size="small" variant="outlined" onClick={() => onReview(booking)}>
              Leave a Review
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
