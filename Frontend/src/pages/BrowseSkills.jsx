import { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardContent, Skeleton, Stack } from "@mui/material";
import skillService from "../services/skillService";
import SkillCard from "../components/skills/SkillCard";
import SkillFilters from "../components/skills/SkillFilters";
import EmptyState from "../components/common/EmptyState";
import PaginationBar from "../components/common/PaginationBar";
import useDebounce from "../hooks/useDebounce";

function SkillCardSkeleton() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" mb={1.5}>
          <Skeleton variant="rounded" width={80} height={22} />
          <Skeleton variant="rounded" width={50} height={22} />
        </Stack>
        <Skeleton variant="text" width="80%" height={28} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="60%" sx={{ mb: 1.5 }} />
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width="50%" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function BrowseSkills() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [page, setPage] = useState(1);

  const [skills, setSkills] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, sortBy]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await skillService.search({
          search: debouncedSearch,
          category: category || undefined,
          sort_by: sortBy,
          order: "desc",
          page,
          per_page: 12,
        });
        if (mounted) {
          setSkills(data.data);
          setTotalPages(data.meta.total_pages);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch, category, sortBy, page]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Browse Skills
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Find a mentor and book a session using your credits.
      </Typography>

      <SkillFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {loading ? (
        <Grid container spacing={2.5}>
          {[...Array(8)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <SkillCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : skills.length === 0 ? (
        <EmptyState
          title="No skills found"
          message="Try adjusting your search or filters."
        />
      ) : (
        <>
          <Grid container spacing={2.5}>
            {skills.map((skill) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={skill.id}>
                <SkillCard skill={skill} />
              </Grid>
            ))}
          </Grid>
          <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </Box>
  );
}
