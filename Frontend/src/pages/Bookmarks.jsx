import { useCallback, useEffect, useState } from "react";
import { Box, Typography, Grid } from "@mui/material";
import skillService from "../services/skillService";
import SkillCard from "../components/skills/SkillCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import PaginationBar from "../components/common/PaginationBar";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await skillService.listBookmarks({ page, per_page: 12 });
      setBookmarks(data.data);
      setTotalPages(data.meta.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Bookmarked Skills
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Skills you&apos;ve saved for later.
      </Typography>

      {loading ? (
        <LoadingSpinner label="Loading bookmarks…" />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          message="Save skills you're interested in while browsing so you can find them again easily."
        />
      ) : (
        <>
          <Grid container spacing={2.5}>
            {bookmarks.map((bookmark) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={bookmark.id}>
                <SkillCard skill={bookmark.skill} />
              </Grid>
            ))}
          </Grid>
          <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </Box>
  );
}
