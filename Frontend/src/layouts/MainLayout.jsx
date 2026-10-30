import { Outlet, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ErrorBoundary from "../components/common/ErrorBoundary";
import PageTransition from "../components/common/PageTransition";

export default function MainLayout() {
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, width: "100%" }}>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <ErrorBoundary key={location.pathname}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </ErrorBoundary>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
