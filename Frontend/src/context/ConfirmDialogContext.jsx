import { createContext, useCallback, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    danger: false,
  });
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    setState({
      open: true,
      title: options.title || "Are you sure?",
      message: options.message || "",
      confirmLabel: options.confirmLabel || "Confirm",
      danger: Boolean(options.danger),
    });
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (result) => {
    setState((prev) => ({ ...prev, open: false }));
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <Dialog open={state.open} onClose={() => handleClose(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{state.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{state.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => handleClose(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleClose(true)}
            variant="contained"
            color={state.danger ? "error" : "primary"}
            autoFocus
          >
            {state.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}
