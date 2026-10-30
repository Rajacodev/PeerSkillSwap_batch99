import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  Grid,
  Alert,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Divider,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import aiService from "../services/aiService";
import EmptyState from "../components/common/EmptyState";
import SkillCard from "../components/skills/SkillCard";
import getErrorMessage from "../utils/getErrorMessage";
import { formatDate } from "../utils/formatters";

const PRIORITY_COLOR = { high: "error", medium: "warning", low: "default" };

function RecommendedSkillCard({ skill }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 3 },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {skill.name}
          </Typography>
          <Chip label={skill.priority} size="small" color={PRIORITY_COLOR[skill.priority] || "default"} />
        </Stack>
        <Chip label={skill.category} size="small" variant="outlined" sx={{ mb: 1.5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {skill.reason}
        </Typography>

        {skill.matching_platform_skills?.length > 0 ? (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Available to book on PeerSkillSwap:
            </Typography>
            <Stack spacing={1}>
              {skill.matching_platform_skills.map((platformSkill) => (
                <SkillCard key={platformSkill.id} skill={platformSkill} />
              ))}
            </Stack>
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
            No mentors teaching this yet. Check back later or list it yourself!
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function CareerAdvisor() {
  const { enqueueSnackbar } = useSnackbar();
  const [jobTitle, setJobTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [providers, setProviders] = useState([]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await aiService.getHistory({ per_page: 10 });
      setHistory(data.data);
    } catch {
      // history is non-critical; leave the list empty on failure
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    aiService
      .getProviders()
      .then(({ data }) => setProviders(data.data.providers))
      .catch(() => {
        // status line is optional; hide it if the request fails
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await aiService.recommendSkills(jobTitle.trim());
      setResult(data.data);
      loadHistory();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const loadFromHistory = (entry) => {
    setResult(entry);
    setJobTitle(entry.job_title);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <Avatar
          sx={{
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
          }}
        >
          <AutoAwesomeRoundedIcon />
        </Avatar>
        <Typography variant="h4">AI Career Advisor</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tell us the job you&apos;re aiming for, and we&apos;ll suggest the skills to learn, matched
        against mentors already teaching them here.
      </Typography>

      {providers.length > 0 && (
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">
            AI engines:
          </Typography>
          {providers.map((p) => (
            <Chip
              key={p.name}
              size="small"
              label={p.label}
              color={p.configured ? "success" : "default"}
              variant={p.configured ? "filled" : "outlined"}
              sx={{ opacity: p.configured ? 1 : 0.55 }}
            />
          ))}
          <Chip size="small" variant="outlined" label="Curated dataset (always on)" />
        </Stack>
      )}

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                label="Target job title"
                placeholder="e.g. Data Scientist, UX Designer, Product Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                InputProps={{ startAdornment: <WorkRoundedIcon sx={{ mr: 1, color: "text.disabled" }} /> }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting || !jobTitle.trim()}
                sx={{ whiteSpace: "nowrap" }}
              >
                {submitting ? "Thinking…" : "Get Recommendations"}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {submitting && (
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Skeleton variant="rounded" height={80} />
          <Grid container spacing={2}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Skeleton variant="rounded" height={160} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}

      {!submitting && result && (
        <Box sx={{ mb: 5 }}>
          <Alert
            severity={result.generated_by_ai ? "success" : "info"}
            icon={<AutoAwesomeRoundedIcon fontSize="inherit" />}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {result.generated_by_ai
                ? `AI-generated by ${result.provider_label || result.provider}`
                : "Curated recommendation"}{" "}
              for &ldquo;{result.job_title}&rdquo;
            </Typography>
            <Typography variant="body2">{result.summary}</Typography>
          </Alert>

          <Grid container spacing={2.5}>
            {result.recommended_skills.map((skill) => (
              <Grid item xs={12} sm={6} key={skill.name}>
                <RecommendedSkillCard skill={skill} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {!submitting && !result && (
        <EmptyState
          title="Discover your learning path"
          message='Type a job title above, like "Frontend Developer" or "Digital Marketer", and get a tailored list of skills to learn.'
          icon={AutoAwesomeRoundedIcon}
        />
      )}

      <Divider sx={{ my: 4 }} />

      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <HistoryRoundedIcon color="action" />
        <Typography variant="h6">Your Past Searches</Typography>
      </Stack>

      {loadingHistory ? (
        <Stack spacing={1}>
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={56} />
          ))}
        </Stack>
      ) : history.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No searches yet. Your recommendation history will show up here.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {history.map((entry) => (
            <Accordion key={entry.id} disableGutters variant="outlined">
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ sm: "center" }}
                  sx={{ width: "100%", pr: 2 }}
                  spacing={0.5}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ fontWeight: 600 }}>{entry.job_title}</Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={entry.generated_by_ai ? entry.provider : "curated"}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(entry.created_at)}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {entry.summary}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                  {entry.recommended_skills.map((s) => (
                    <Chip key={s.name} label={s.name} size="small" />
                  ))}
                </Stack>
                <Button size="small" onClick={() => loadFromHistory(entry)}>
                  View full details
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Box>
  );
}
