import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Rating,
  Typography,
} from "@mui/material";

export default function ReviewDialog({ open, onClose, onSubmit, booking, submitting }) {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { rating: 5, comment: "" },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const submitHandler = (values) => {
    onSubmit({ booking_id: booking.id, rating: values.rating, comment: values.comment });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Review {booking?.mentor?.name}</DialogTitle>
      <form onSubmit={handleSubmit(submitHandler)}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              How was your &ldquo;{booking?.skill?.title}&rdquo; session?
            </Typography>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <Rating
                  {...field}
                  size="large"
                  onChange={(_, value) => field.onChange(value)}
                />
              )}
            />
            <Controller
              name="comment"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Comment (optional)" fullWidth multiline minRows={3} />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            Submit Review
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
