import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { SKILL_CATEGORIES } from "../../utils/constants";

export default function SkillFilters({ search, onSearchChange, category, onCategoryChange, sortBy, onSortChange }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          fullWidth
          placeholder="Search skills (e.g. Python, Guitar, Spanish)…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          sx={{ minWidth: { sm: 180 } }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {SKILL_CATEGORIES.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Sort by"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          sx={{ minWidth: { sm: 180 } }}
        >
          <MenuItem value="created_at">Newest</MenuItem>
          <MenuItem value="total_bookings">Most Popular</MenuItem>
          <MenuItem value="average_rating">Top Rated</MenuItem>
          <MenuItem value="credits_per_session">Lowest Credits</MenuItem>
        </TextField>
      </Stack>
    </Box>
  );
}
