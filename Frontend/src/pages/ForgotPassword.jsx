import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Typography, TextField, Button, Stack, Link, Alert } from "@mui/material";
import authService from "../services/authService";
import getErrorMessage from "../utils/getErrorMessage";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = async (values) => {
    setServerError("");
    setSubmitting(true);
    try {
      await authService.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Check your email
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          If an account exists for {getValues("email")}, a reset token has been sent.
        </Alert>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate("/reset-password", { state: { email: getValues("email") } })}
        >
          I have my reset token
        </Button>
      </>
    );
  }

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Forgot your password?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your email and we&apos;ll send you a reset token.
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
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
                autoFocus
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            )}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset token"}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }} color="text.secondary">
        Remembered it?{" "}
        <Link component={RouterLink} to="/login" underline="hover">
          Back to login
        </Link>
      </Typography>
    </>
  );
}
