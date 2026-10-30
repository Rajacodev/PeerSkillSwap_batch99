import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
} from "@mui/material";
import { SKILL_CATEGORIES } from "../../utils/constants";

const DEFAULTS = {
  title: "",
  description: "",
  category: "Other",
  credits_per_session: 1,
  duration_minutes: 60,
  tags: "",
};

export default function SkillFormDialog({ open, onClose, onSubmit, initialValues, submitting }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULTS });

  useEffect(() => {
    if (open) {
      reset(
        initialValues
          ? { ...initialValues, tags: (initialValues.tags || []).join(", ") }
          : DEFAULTS
      );
    }
  }, [open, initialValues, reset]);

  const submitHandler = (values) => {
    const payload = {
      ...values,
      credits_per_session: Number(values.credits_per_session),
      duration_minutes: Number(values.duration_minutes),
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues ? "Edit Skill" : "Create a New Skill"}</DialogTitle>
      <form onSubmit={handleSubmit(submitHandler)}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "Title is required", minLength: { value: 3, message: "Too short" } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Skill title"
                  fullWidth
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              rules={{
                required: "Description is required",
                minLength: { value: 10, message: "Please write at least 10 characters" },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  error={Boolean(errors.description)}
                  helperText={errors.description?.message}
                />
              )}
            />
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Category" fullWidth>
                  {SKILL_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Tags (comma separated)" fullWidth placeholder="python, coding" />
              )}
            />
            <Stack direction="row" spacing={2}>
              <Controller
                name="credits_per_session"
                control={control}
                rules={{ required: true, min: { value: 1, message: "Must be at least 1" } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Credits per session"
                    fullWidth
                    error={Boolean(errors.credits_per_session)}
                    helperText={errors.credits_per_session?.message}
                  />
                )}
              />
              <Controller
                name="duration_minutes"
                control={control}
                rules={{ required: true, min: { value: 15, message: "At least 15 minutes" } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Duration (minutes)"
                    fullWidth
                    error={Boolean(errors.duration_minutes)}
                    helperText={errors.duration_minutes?.message}
                  />
                )}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {initialValues ? "Save Changes" : "Create Skill"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
