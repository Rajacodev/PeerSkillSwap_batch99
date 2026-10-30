import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import walletService from "../services/walletService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import PaginationBar from "../components/common/PaginationBar";
import { formatDateTime, capitalize } from "../utils/formatters";

const REASON_LABELS = {
  signup_bonus: "Signup bonus",
  session_taught: "Taught a session",
  session_learned: "Learned a session",
  admin_adjustment: "Admin adjustment",
  refund: "Refund",
};

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        walletService.getMyWallet(),
        walletService.getTransactions({ page, per_page: 10 }),
      ]);
      setWallet(walletRes.data.data);
      setTransactions(txRes.data.data);
      setTotalPages(txRes.data.meta.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !wallet) return <LoadingSpinner label="Loading wallet…" />;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Wallet
      </Typography>

      <Card
        variant="outlined"
        sx={{
          mb: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: "#fff",
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}>
              <AccountBalanceWalletRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Current Balance
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {wallet?.balance} <span style={{ fontSize: "1.2rem", fontWeight: 400 }}>credits</span>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Transaction History
          </Typography>
          {transactions.length === 0 ? (
            <EmptyState title="No transactions yet" message="Your credit history will show up here." />
          ) : (
            <>
              <List disablePadding>
                {transactions.map((tx, idx) => (
                  <Box key={tx.id}>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: tx.type === "credit" ? "success.main" : "error.main",
                          }}
                        >
                          {tx.type === "credit" ? (
                            <ArrowUpwardRoundedIcon fontSize="small" />
                          ) : (
                            <ArrowDownwardRoundedIcon fontSize="small" />
                          )}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={REASON_LABELS[tx.reason] || capitalize(tx.reason)}
                        secondary={formatDateTime(tx.created_at)}
                      />
                      <Stack alignItems="flex-end">
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: tx.type === "credit" ? "success.main" : "error.main",
                          }}
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {tx.amount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Balance: {tx.balance_after}
                        </Typography>
                      </Stack>
                    </ListItem>
                    {idx < transactions.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
              <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
