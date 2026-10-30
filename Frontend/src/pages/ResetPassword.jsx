import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { Typography, TextField, Button, Stack, Link, Alert } from "@mui/material";
import authService from "../services/authService";
import getErrorMessage from "../utils/getErrorMessage";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: location.state?.email || "",
      reset_token: "",
      new_password: "",
    },
  });

  const onSubmit = async (values) => {
    setServerError("");
    setSubmitting(true);
    try {
      await authService.resetPassword(values);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Reset your password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the reset token you received along with a new password.
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password reset! Redirecting to login…
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Controller
            name="email"
            control={control}
            rules={{ required: "Email is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            )}
          />
          <Controller
            name="reset_token"
            control={control}
            rules={{ required: "Reset token is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Reset token"
                fullWidth
                error={Boolean(errors.reset_token)}
                helperText={errors.reset_token?.message}
              />
            )}
          />
          <Controller
            name="new_password"
            control={control}
            rules={{
              required: "New password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="New password"
                type="password"
                fullWidth
                error={Boolean(errors.new_password)}
                helperText={errors.new_password?.message}
              />
            )}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "Resetting…" : "Reset password"}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }} color="text.secondary">
        <Link component={RouterLink} to="/login" underline="hover">
          Back to login
        </Link>
      </Typography>
    </>
  );
}
