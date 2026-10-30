import { useContext } from "react";
import { ConfirmDialogContext } from "../context/ConfirmDialogContext";

export default function useConfirm() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  return ctx.confirm;
}
