import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Divider,
  Alert,
} from "@mui/material";
import UserAvatar from "../components/common/UserAvatar";
import userService from "../services/userService";
import useAuth from "../hooks/useAuth";
import getErrorMessage from "../utils/getErrorMessage";

export default function EditProfile() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const profileForm = useForm({
    defaultValues: { name: "", bio: "", skills_offered: "", skills_wanted: "" },
  });
  const passwordForm = useForm({
    defaultValues: { current_password: "", new_password: "" },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        bio: user.bio || "",
        skills_offered: (user.skills_offered || []).join(", "),
        skills_wanted: (user.skills_wanted || []).join(", "),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSaveProfile = async (values) => {
    setSavingProfile(true);
    try {
      await userService.updateMe({
        name: values.name,
        bio: values.bio,
        skills_offered: values.skills_offered.split(",").map((s) => s.trim()).filter(Boolean),
        skills_wanted: values.skills_wanted.split(",").map((s) => s.trim()).filter(Boolean),
      });
      await refreshProfile();
      enqueueSnackbar("Profile updated", { variant: "success" });
      navigate("/profile");
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePassword = async (values) => {
    setPasswordError("");
    setSavingPassword(true);
    try {
      await userService.changePassword(values);
      enqueueSnackbar("Password changed", { variant: "success" });
      passwordForm.reset();
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await userService.uploadProfilePicture(file);
      await refreshProfile();
      enqueueSnackbar("Profile picture updated", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Edit Profile
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2.5} mb={3}>
            <UserAvatar user={user} size={72} />
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Change photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Box>
          </Stack>

          <form onSubmit={profileForm.handleSubmit(onSaveProfile)}>
            <Stack spacing={2.5}>
              <Controller
                name="name"
                control={profileForm.control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <TextField {...field} label="Full name" fullWidth />
                )}
              />
              <Controller
                name="bio"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField {...field} label="Bio" fullWidth multiline minRows={3} />
                )}
              />
              <Controller
                name="skills_offered"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Skills you can teach (comma separated)"
                    fullWidth
                    placeholder="python, guitar, spanish"
                  />
                )}
              />
              <Controller
                name="skills_wanted"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Skills you want to learn (comma separated)"
                    fullWidth
                    placeholder="painting, public speaking"
                  />
                )}
              />
              <Button type="submit" variant="contained" disabled={savingProfile} sx={{ alignSelf: "flex-start" }}>
                Save Changes
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Change Password
          </Typography>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <form onSubmit={passwordForm.handleSubmit(onSavePassword)}>
            <Stack spacing={2.5}>
              <Controller
                name="current_password"
                control={passwordForm.control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <TextField {...field} type="password" label="Current password" fullWidth />
                )}
              />
              <Controller
                name="new_password"
                control={passwordForm.control}
                rules={{ required: "Required", minLength: { value: 6, message: "At least 6 characters" } }}
                render={({ field }) => (
                  <TextField {...field} type="password" label="New password" fullWidth />
                )}
              />
              <Divider />
              <Button type="submit" variant="outlined" disabled={savingPassword} sx={{ alignSelf: "flex-start" }}>
                Update Password
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
