import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import callService from "../services/callService";
import { TOKEN_STORAGE_KEY } from "../utils/constants";

// Same origin by default: Vite (dev) and nginx (Docker) forward /socket.io.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

/**
 * Runs one 1:1 WebRTC call for a booking. It connects to the Socket.IO
 * signalling channel, negotiates a peer connection, and exposes mute, camera,
 * screen share, leave, and a small in-call chat.
 *
 * Negotiation: whoever joins second receives the list of people already in
 * the room, and sends the WebRTC offer. The first participant waits for it.
 * This stops both sides from offering at the same time.
 */
export default function useVideoCall(bookingId) {
  const [status, setStatus] = useState("connecting"); // connecting | waiting | connected | ended | error
  const [errorMessage, setErrorMessage] = useState("");
  const [peerInfo, setPeerInfo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);
  const pendingCandidatesRef = useRef([]);

  const closePeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
  }, []);

  const cleanup = useCallback(() => {
    closePeer();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.emit("leave_call", { booking_id: bookingId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [bookingId, closePeer]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("signal", {
          booking_id: bookingId,
          signal: { type: "ice-candidate", candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setStatus("connected");
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setStatus("error");
        setErrorMessage("The connection to the other participant failed. Try leaving and rejoining.");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "closed") {
        setStatus((prev) => (prev === "ended" ? prev : "waiting"));
      }
    };

    pcRef.current = pc;
    return pc;
  }, [bookingId]);

  const makeOffer = useCallback(async () => {
    const pc = pcRef.current || createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("signal", {
      booking_id: bookingId,
      signal: { type: "offer", sdp: pc.localDescription },
    });
  }, [bookingId, createPeerConnection]);

  const applyPendingCandidates = useCallback(async (pc) => {
    for (const candidate of pendingCandidatesRef.current) {
      await pc.addIceCandidate(candidate);
    }
    pendingCandidatesRef.current = [];
  }, []);

  const handleOffer = useCallback(
    async (sdp) => {
      const pc = pcRef.current || createPeerConnection();
      await pc.setRemoteDescription(sdp);
      await applyPendingCandidates(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit("signal", {
        booking_id: bookingId,
        signal: { type: "answer", sdp: pc.localDescription },
      });
    },
    [applyPendingCandidates, bookingId, createPeerConnection]
  );

  const handleAnswer = useCallback(
    async (sdp) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      await applyPendingCandidates(pc);
    },
    [applyPendingCandidates]
  );

  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // Late or duplicate candidates are harmless, so ignore them.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          localStream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = localStream;
        cameraTrackRef.current = localStream.getVideoTracks()[0] || null;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            "Couldn't access your camera or microphone. Check your browser permissions and try again."
          );
        }
        return;
      }

      try {
        const { data } = await callService.getIceServers();
        if (!cancelled && data?.data?.ice_servers?.length) {
          iceServersRef.current = data.data.ice_servers;
        }
      } catch {
        // Keep the default public STUN server.
      }

      // React StrictMode mounts twice in development. Check again after the
      // await, or the first mount would open a second socket for this user.
      if (cancelled) return;

      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join_call", { booking_id: bookingId });
      });

      socket.on("connect_error", () => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Couldn't connect to the call server. Please try again.");
        }
      });

      socket.on("joined_call", ({ peers }) => {
        if (cancelled) return;
        if (peers && peers.length > 0) {
          setPeerInfo(peers[0]);
          setStatus("waiting");
          makeOffer();
        } else {
          setStatus("waiting");
        }
      });

      socket.on("peer_joined", (peer) => {
        if (cancelled) return;
        setPeerInfo(peer);
        setStatus("waiting");
      });

      socket.on("signal", async ({ signal }) => {
        if (cancelled || !signal) return;
        if (signal.type === "offer") await handleOffer(signal.sdp);
        else if (signal.type === "answer") await handleAnswer(signal.sdp);
        else if (signal.type === "ice-candidate") await handleIceCandidate(signal.candidate);
      });

      socket.on("peer_left", () => {
        if (cancelled) return;
        setPeerInfo(null);
        setStatus("waiting");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        closePeer();
      });

      socket.on("call_error", (payload) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(payload?.message || "Something went wrong with this call.");
      });

      socket.on("chat_message", ({ message, sender_name }) => {
        if (cancelled) return;
        setChatMessages((prev) => [...prev, { message, sender: sender_name, mine: false }]);
      });
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOff(!videoTrack.enabled);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");

    if (isScreenSharing) {
      if (sender && cameraTrackRef.current) await sender.replaceTrack(cameraTrackRef.current);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (sender) await sender.replaceTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setIsScreenSharing(true);

      // The browser's own "Stop sharing" button ends the track; switch back then.
      screenTrack.onended = async () => {
        if (sender && cameraTrackRef.current) await sender.replaceTrack(cameraTrackRef.current);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsScreenSharing(false);
      };
    } catch {
      // The user cancelled the screen picker. Nothing to do.
    }
  }, [isScreenSharing]);

  const sendChatMessage = useCallback(
    (text) => {
      if (!text?.trim()) return;
      socketRef.current?.emit("chat_message", { booking_id: bookingId, message: text.trim() });
      setChatMessages((prev) => [...prev, { message: text.trim(), sender: "You", mine: true }]);
    },
    [bookingId]
  );

  const leaveCall = useCallback(() => {
    cleanup();
    setStatus("ended");
  }, [cleanup]);

  return {
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
  };
}
