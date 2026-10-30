import { Box, Pagination } from "@mui/material";

export default function PaginationBar({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, value) => onChange(value)}
        color="primary"
        shape="rounded"
      />
    </Box>
  );
}
