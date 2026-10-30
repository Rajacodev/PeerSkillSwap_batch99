import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Paper,
  Chip,
  TextField,
  Drawer,
  Divider,
  Tooltip,
  Alert,
  Button,
} from "@mui/material";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VideocamOffRoundedIcon from "@mui/icons-material/VideocamOffRounded";
import ScreenShareRoundedIcon from "@mui/icons-material/ScreenShareRounded";
import StopScreenShareRoundedIcon from "@mui/icons-material/StopScreenShareRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import useVideoCall from "../hooks/useVideoCall";
import bookingService from "../services/bookingService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import UserAvatar from "../components/common/UserAvatar";

const STATUS_LABEL = {
  connecting: "Setting up your camera and microphone…",
  waiting: "Waiting for the other participant to join…",
  connected: "Connected",
  ended: "Call ended",
  error: "Something went wrong",
};

export default function CallRoom() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  const {
    localVideoRef,
    remoteVideoRef,
    status,
    errorMessage,
    peerInfo,
    isMuted,
    isCameraOff,
    isScreenSharing,
    chatMessages,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
    leaveCall,
  } = useVideoCall(bookingId);

  useEffect(() => {
    let mounted = true;
    bookingService
      .getById(bookingId)
      .then(({ data }) => mounted && setBooking(data.data))
      .finally(() => mounted && setLoadingBooking(false));
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const handleLeave = () => {
    leaveCall();
    navigate("/bookings");
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput("");
  };

  if (loadingBooking) return <LoadingSpinner label="Loading session…" />;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "#0d1214",
        display: "flex",
        flexDirection: "column",
        zIndex: 1300,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 1.5, color: "#fff" }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {booking?.skill?.title || "Session"}
          </Typography>
          <Chip
            label={STATUS_LABEL[status] || status}
            size="small"
            color={status === "connected" ? "success" : status === "error" ? "error" : "default"}
            sx={{ color: status === "connected" || status === "error" ? "#fff" : undefined }}
          />
        </Stack>
        <Tooltip title="In-call chat">
          <IconButton onClick={() => setChatOpen(true)} sx={{ color: "#fff" }}>
            <ChatRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mx: 2.5, mb: 1 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, position: "relative", mx: 2.5, mb: 2, borderRadius: 3, overflow: "hidden" }}>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: "#181f22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 3,
          }}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: status === "connected" ? "block" : "none",
            }}
          />
          {status !== "connected" && (
            <Stack alignItems="center" spacing={2}>
              {peerInfo ? (
                <UserAvatar user={peerInfo} size={88} />
              ) : (
                <Box sx={{ width: 88, height: 88, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />
              )}
              <Typography color="rgba(255,255,255,0.7)">{STATUS_LABEL[status] || status}</Typography>
            </Stack>
          )}
        </Box>

        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            width: { xs: 110, sm: 180 },
            height: { xs: 82, sm: 130 },
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "#000",
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
              display: isCameraOff ? "none" : "block",
            }}
          />
          {isCameraOff && (
            <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <VideocamOffRoundedIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
            </Box>
          )}
        </Paper>
      </Box>

      <Stack direction="row" justifyContent="center" spacing={2} sx={{ pb: 4 }}>
        <ControlButton active={!isMuted} onClick={toggleMute} label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <MicOffRoundedIcon /> : <MicRoundedIcon />}
        </ControlButton>
        <ControlButton
          active={!isCameraOff}
          onClick={toggleCamera}
          label={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? <VideocamOffRoundedIcon /> : <VideocamRoundedIcon />}
        </ControlButton>
        <ControlButton
          active={isScreenSharing}
          onClick={toggleScreenShare}
          label={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? <StopScreenShareRoundedIcon /> : <ScreenShareRoundedIcon />}
        </ControlButton>
        <Tooltip title="Leave call">
          <IconButton
            onClick={handleLeave}
            sx={{ bgcolor: "error.main", color: "#fff", width: 56, height: 56, "&:hover": { bgcolor: "error.dark" } }}
          >
            <CallEndRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {status === "ended" && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <Typography variant="h5" sx={{ color: "#fff" }}>
              Call ended
            </Typography>
            <Button variant="contained" onClick={() => navigate("/bookings")}>
              Back to Bookings
            </Button>
          </Stack>
        </Box>
      )}

      <Drawer anchor="right" open={chatOpen} onClose={() => setChatOpen(false)}>
        <Box sx={{ width: { xs: "85vw", sm: 320 }, display: "flex", flexDirection: "column", height: "100%" }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            In-call chat
          </Typography>
          <Divider />
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
            {chatMessages.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No messages yet. Say hi!
              </Typography>
            )}
            <Stack spacing={1.5}>
              {chatMessages.map((msg, i) => (
                <Box
                  key={i}
                  sx={{
                    alignSelf: msg.mine ? "flex-end" : "flex-start",
                    bgcolor: msg.mine ? "primary.main" : "action.hover",
                    color: msg.mine ? "primary.contrastText" : "text.primary",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: "85%",
                  }}
                >
                  {!msg.mine && (
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                      {msg.sender}
                    </Typography>
                  )}
                  <Typography variant="body2">{msg.message}</Typography>
                </Box>
              ))}
              <div ref={chatEndRef} />
            </Stack>
          </Box>
          <Divider />
          <Box component="form" onSubmit={handleSendChat} sx={{ p: 1.5, display: "flex", gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Type a message…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <IconButton type="submit" color="primary">
              <SendRoundedIcon />
            </IconButton>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

function ControlButton({ active, onClick, label, children }) {
  return (
    <Tooltip title={label}>
      <IconButton
        onClick={onClick}
        sx={{
          bgcolor: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.25)",
          color: "#fff",
          width: 56,
          height: 56,
          "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}
