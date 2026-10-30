import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import App from "./App";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          autoHideDuration={3500}
        >
          <AuthProvider>
            <ConfirmDialogProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </ConfirmDialogProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
