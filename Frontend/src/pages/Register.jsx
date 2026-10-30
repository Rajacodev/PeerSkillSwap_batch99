import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Link,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  FormHelperText,
} from "@mui/material";
import useAuth from "../hooks/useAuth";
import getErrorMessage from "../utils/getErrorMessage";

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "", email: "", password: "", role: "student" },
  });

  const onSubmit = async (values) => {
    setServerError("");
    setSubmitting(true);
    try {
      await registerUser(values);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Create your account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Join for free — you&apos;ll start with 10 credits to use right away.
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Controller
            name="name"
            control={control}
            rules={{ required: "Name is required", minLength: { value: 2, message: "Too short" } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Full name"
                fullWidth
                autoFocus
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            rules={{
              required: "Email is required",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
            }}
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
            name="password"
            control={control}
            rules={{
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type="password"
                fullWidth
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
            )}
          />

          <Stack>
            <Typography variant="body2" sx={{ mb: 1 }}>
              I want to join as a...
            </Typography>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <ToggleButtonGroup
                  {...field}
                  exclusive
                  fullWidth
                  onChange={(_, value) => value && field.onChange(value)}
                >
                  <ToggleButton value="student">Student — I want to learn</ToggleButton>
                  <ToggleButton value="mentor">Mentor — I want to teach</ToggleButton>
                </ToggleButtonGroup>
              )}
            />
            <FormHelperText>You can list skills to teach later even as a student.</FormHelperText>
          </Stack>

          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }} color="text.secondary">
        Already have an account?{" "}
        <Link component={RouterLink} to="/login" underline="hover">
          Log in
        </Link>
      </Typography>
    </>
  );
}
