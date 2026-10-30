import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";

function toDatetimeLocalMin() {
  const d = new Date(Date.now() + 60 * 60 * 1000); // at least 1 hour from now
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default function BookingRequestDialog({ open, onClose, onSubmit, skill, submitting }) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { scheduled_at: "", notes: "" },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const submitHandler = (values) => {
    onSubmit({
      skill_id: skill.id,
      scheduled_at: new Date(values.scheduled_at).toISOString(),
      notes: values.notes,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Request a Session</DialogTitle>
      <form onSubmit={handleSubmit(submitHandler)}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Alert severity="info" sx={{ fontSize: 13 }}>
              This session costs <strong>{skill?.credits_per_session} credits</strong>, deducted
              once {skill?.mentor?.name} marks it complete.
            </Alert>
            <Controller
              name="scheduled_at"
              control={control}
              rules={{ required: "Please choose a date and time" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="datetime-local"
                  label="Preferred date & time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: toDatetimeLocalMin() }}
                  error={Boolean(errors.scheduled_at)}
                  helperText={errors.scheduled_at?.message}
                />
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes for the mentor (optional)"
                  fullWidth
                  multiline
                  minRows={2}
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
            Send Request
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
