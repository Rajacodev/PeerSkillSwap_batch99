import { Link as RouterLink } from "react-router-dom";
import { Card, CardActionArea, CardContent, Box, Typography, Chip, Stack } from "@mui/material";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import UserAvatar from "../common/UserAvatar";
import RatingStars from "../common/RatingStars";
import CreditBadge from "../common/CreditBadge";

export default function SkillCard({ skill }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: (theme) =>
            theme.palette.mode === "light"
              ? "0 16px 32px -12px rgba(15,82,87,0.25)"
              : "0 16px 32px -12px rgba(0,0,0,0.6)",
          borderColor: "primary.main",
        },
        "&:hover .skill-card-accent": {
          transform: "scaleX(1)",
        },
      }}
    >
      <Box
        className="skill-card-accent"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: (theme) =>
            `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
          transform: "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.3s ease",
        }}
      />
      <CardActionArea
        component={RouterLink}
        to={`/skills/${skill.id}`}
        sx={{ height: "100%", display: "flex", alignItems: "stretch" }}
      >
        <CardContent sx={{ width: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Chip label={skill.category} size="small" color="primary" variant="outlined" />
            <CreditBadge amount={skill.credits_per_session} size="small" />
          </Stack>

          <Typography variant="h6" sx={{ fontSize: "1.05rem", mb: 0.5 }}>
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
              minHeight: 40,
            }}
          >
            {skill.description}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <ScheduleRoundedIcon fontSize="small" color="disabled" />
            <Typography variant="caption" color="text.secondary">
              {skill.duration_minutes} min session
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <UserAvatar user={skill.mentor} size={28} />
              <Typography variant="body2">{skill.mentor?.name}</Typography>
            </Stack>
            <RatingStars value={skill.average_rating} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
