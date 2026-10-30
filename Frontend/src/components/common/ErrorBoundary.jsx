import { Component } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

/**
 * Catches render-time errors anywhere in the tree below it and shows a
 * friendly, recoverable screen instead of leaving the user with a blank
 * page. Must be a class component — React only supports error boundaries
 * via componentDidCatch / getDerivedStateFromError.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Caught by ErrorBoundary:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 3,
          }}
        >
          <ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 56, mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, maxWidth: 480 }}>
            This page hit an unexpected error. You can head back to your dashboard, or reload
            the page.
          </Typography>
          {this.state.error?.message && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 3, fontFamily: "monospace", opacity: 0.7 }}
            >
              {this.state.error.message}
            </Typography>
          )}
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={this.handleReset}>
              Back to dashboard
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}
