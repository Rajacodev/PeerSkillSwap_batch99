import { useCallback, useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { Box, Typography, Tabs, Tab, Stack, MenuItem, TextField } from "@mui/material";
import bookingService from "../services/bookingService";
import BookingCard from "../components/bookings/BookingCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import PaginationBar from "../components/common/PaginationBar";
import ReviewDialog from "../components/reviews/ReviewDialog";
import MeetingLinkDialog from "../components/bookings/MeetingLinkDialog";
import reviewService from "../services/reviewService";
import useAuth from "../hooks/useAuth";
import useConfirm from "../hooks/useConfirm";
import getErrorMessage from "../utils/getErrorMessage";

const STATUS_OPTIONS = ["", "pending", "accepted", "completed", "rejected", "cancelled"];

export default function Bookings() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();

  const [tab, setTab] = useState(user?.role === "mentor" || user?.role === "admin" ? "mentor" : "student");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [meetingLinkTarget, setMeetingLinkTarget] = useState(null);
  const [meetingLinkMode, setMeetingLinkMode] = useState("accept");
  const [submittingMeetingLink, setSubmittingMeetingLink] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 8, status: status || undefined };
      const { data } =
        tab === "mentor"
          ? await bookingService.listAsMentor(params)
          : await bookingService.listAsStudent(params);
      setBookings(data.data);
      setTotalPages(data.meta.total_pages);
    } finally {
      setLoading(false);
    }
  }, [tab, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, status]);

  const handleAcceptClick = (booking) => {
    setMeetingLinkMode("accept");
    setMeetingLinkTarget(booking);
  };

  const handleEditMeetingLinkClick = (booking) => {
    setMeetingLinkMode("edit");
    setMeetingLinkTarget(booking);
  };

  const handleMeetingLinkSubmit = async (meetingLink) => {
    setSubmittingMeetingLink(true);
    try {
      if (meetingLinkMode === "accept") {
        await bookingService.accept(meetingLinkTarget.id, meetingLink);
        enqueueSnackbar("Booking accepted", { variant: "success" });
      } else {
        await bookingService.updateMeetingLink(meetingLinkTarget.id, meetingLink);
        enqueueSnackbar("Meeting link saved", { variant: "success" });
      }
      setMeetingLinkTarget(null);
      load();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    } finally {
      setSubmittingMeetingLink(false);
    }
  };

  const handleReject = async (booking) => {
    const ok = await confirm({
      title: "Reject this request?",
      message: `Reject the session request from ${booking.student?.name}?`,
      confirmLabel: "Reject",
      danger: true,
    });
    if (!ok) return;
    try {
      await bookingService.reject(booking.id, "Not available at this time");
      enqueueSnackbar("Booking rejected", { variant: "info" });
      load();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    }
  };

  const handleComplete = async (booking) => {
    const ok = await confirm({
      title: "Mark session as completed?",
      message: `This will transfer ${booking.credits_charged} credits from ${booking.student?.name} to you.`,
      confirmLabel: "Mark Completed",
    });
    if (!ok) return;
    try {
      await bookingService.complete(booking.id);
      enqueueSnackbar("Session marked as completed. Credits transferred!", { variant: "success" });
      load();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    }
  };

  const handleCancel = async (booking) => {
    const ok = await confirm({
      title: "Cancel this booking?",
      message: "This action cannot be undone.",
      confirmLabel: "Cancel Booking",
      danger: true,
    });
    if (!ok) return;
    try {
      await bookingService.cancel(booking.id, "Cancelled by user");
      enqueueSnackbar("Booking cancelled", { variant: "info" });
      load();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    }
  };

  const handleReviewSubmit = async (payload) => {
    setSubmittingReview(true);
    try {
      await reviewService.create(payload);
      enqueueSnackbar("Review submitted — thank you!", { variant: "success" });
      setReviewTarget(null);
      load();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const canSeeMentorTab = user?.role === "mentor" || user?.role === "admin";

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Bookings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your learning and teaching sessions.
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        mb={2}
      >
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="As Student" value="student" />
          {canSeeMentorTab && <Tab label="As Mentor" value="mentor" />}
        </Tabs>
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <LoadingSpinner label="Loading bookings…" />
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings found" message="Nothing matches these filters yet." />
      ) : (
        <>
          <Stack spacing={2}>
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                viewAs={tab}
                onAccept={handleAcceptClick}
                onReject={handleReject}
                onComplete={handleComplete}
                onCancel={handleCancel}
                onReview={(b) => setReviewTarget(b)}
                onEditMeetingLink={handleEditMeetingLinkClick}
              />
            ))}
          </Stack>
          <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <ReviewDialog
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReviewSubmit}
        booking={reviewTarget}
        submitting={submittingReview}
      />

      <MeetingLinkDialog
        open={Boolean(meetingLinkTarget)}
        onClose={() => setMeetingLinkTarget(null)}
        onSubmit={handleMeetingLinkSubmit}
        booking={meetingLinkTarget}
        mode={meetingLinkMode}
        submitting={submittingMeetingLink}
      />
    </Box>
  );
}
