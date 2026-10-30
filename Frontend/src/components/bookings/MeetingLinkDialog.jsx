import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
} from "@mui/material";

const URL_PATTERN = /^https?:\/\/.+/i;

/**
 * mode="accept": used when a mentor accepts a pending booking — the link is
 * optional, and skipping it just accepts with no link (can be added later).
 * mode="edit": used to set/change the link on an already-accepted booking —
 * the link is required here since there's no other action being confirmed.
 */
export default function MeetingLinkDialog({ open, onClose, onSubmit, booking, mode, submitting }) {
  const isAccept = mode === "accept";
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { meeting_link: "" } });

  useEffect(() => {
    if (open) {
      reset({ meeting_link: booking?.meeting_link || "" });
    }
  }, [open, booking, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const submitHandler = (values) => {
    onSubmit(values.meeting_link.trim());
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {isAccept ? "Accept Session Request" : "Meeting Link"}
      </DialogTitle>
      <form onSubmit={handleSubmit(submitHandler)}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {isAccept
                ? `Add a Zoom, Google Meet, or Teams link so ${booking?.student?.name || "the student"} knows where to join — you can also add this later.`
                : "Paste the link you'll use for this session."}
            </Typography>
            <Controller
              name="meeting_link"
              control={control}
              rules={{
                required: isAccept ? false : "A meeting link is required",
                pattern: {
                  value: URL_PATTERN,
                  message: "Must be a valid link starting with http:// or https://",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={isAccept ? "Meeting link (optional)" : "Meeting link"}
                  placeholder="https://zoom.us/j/1234567890"
                  fullWidth
                  autoFocus
                  error={Boolean(errors.meeting_link)}
                  helperText={errors.meeting_link?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isAccept ? "Accept Session" : "Save Link"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
