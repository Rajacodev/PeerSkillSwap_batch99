import { useCallback, useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import skillService from "../services/skillService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import PaginationBar from "../components/common/PaginationBar";
import CreditBadge from "../components/common/CreditBadge";
import SkillFormDialog from "../components/skills/SkillFormDialog";
import useConfirm from "../hooks/useConfirm";
import getErrorMessage from "../utils/getErrorMessage";

export default function MySkills() {
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await skillService.mine({ page, per_page: 9 });
      setSkills(data.data);
      setTotalPages(data.meta.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingSkill(null);
    setFormOpen(true);
  };

  const openEdit = (skill) => {
    setEditingSkill(skill);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingSkill) {
        await skillService.update(editingSkill.id, payload);
        enqueueSnackbar("Skill updated", { variant: "success" });
      } else {
        await skillService.create(payload);
        enqueueSnackbar("Skill created", { variant: "success" });
      }
      setFormOpen(false);
      load();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (skill) => {
    const ok = await confirm({
      title: "Delete this skill?",
      message: `"${skill.title}" will be permanently removed and can no longer be booked.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await skillService.remove(skill.id);
      enqueueSnackbar("Skill deleted", { variant: "success" });
      load();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    }
  };

  const handleToggleActive = async (skill) => {
    try {
      await skillService.update(skill.id, { is_active: !skill.is_active });
      load();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">My Skills</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the skills you teach.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          New Skill
        </Button>
      </Stack>

      {loading ? (
        <LoadingSpinner label="Loading your skills…" />
      ) : skills.length === 0 ? (
        <EmptyState
          title="You haven't listed any skills yet"
          message="Create your first skill listing so students can book sessions with you."
          actionLabel="Create a Skill"
          onAction={openCreate}
        />
      ) : (
        <>
          <Grid container spacing={2.5}>
            {skills.map((skill) => (
              <Grid item xs={12} sm={6} md={4} key={skill.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Chip label={skill.category} size="small" color="primary" variant="outlined" />
                      <CreditBadge amount={skill.credits_per_session} size="small" />
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {skill.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        mb: 1.5,
                      }}
                    >
                      {skill.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Booked {skill.total_bookings} times · Rating {skill.average_rating || "—"}
                    </Typography>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mt: 1.5 }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={skill.is_active}
                            onChange={() => handleToggleActive(skill)}
                          />
                        }
                        label={
                          <Typography variant="caption">
                            {skill.is_active ? "Active" : "Hidden"}
                          </Typography>
                        }
                      />
                      <Stack direction="row">
                        <IconButton size="small" onClick={() => openEdit(skill)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(skill)}>
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <SkillFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editingSkill}
        submitting={submitting}
      />
    </Box>
  );
}
