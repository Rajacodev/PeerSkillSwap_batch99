"""
Socket.IO signalling for WebRTC video calls between a booking's mentor and
student.

The server only relays small messages: join and leave, SDP offers and
answers, ICE candidates, and in-call chat text. Audio, video and screen
share travel directly between the two browsers once they are connected.

Handlers are registered with register_call_events() each time create_app()
runs. Decorators would bind once, at import, and be lost when a new Socket.IO
server is created for each app instance.
"""
from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room

from app.bookings.repository import BookingRepository
from app.calls import service as call_service
from app.models.user import User

# sid -> {"user_id": str}, set on connect and cleared on disconnect.
_sid_to_user = {}


def _authenticated_user_id():
    info = _sid_to_user.get(request.sid)
    return info["user_id"] if info else None


def _is_booking_participant(booking, user_id):
    return str(booking.student.id) == str(user_id) or str(booking.mentor.id) == str(user_id)


def register_call_events(socketio):
    """Bind the call handlers to this Socket.IO instance."""

    def handle_connect(auth):
        token = (auth or {}).get("token")
        if not token:
            raise ConnectionRefusedError("Missing authentication token")
        try:
            decoded = decode_token(token)
        except Exception:
            raise ConnectionRefusedError("Invalid or expired token")
        # Only a short-lived access token may open a call. A refresh token
        # is long-lived and must never be usable here.
        if decoded.get("type") != "access":
            raise ConnectionRefusedError("An access token is required")
        _sid_to_user[request.sid] = {"user_id": decoded["sub"]}

    def handle_disconnect():
        _sid_to_user.pop(request.sid, None)
        room, _ = call_service.remove_participant(request.sid)
        if room:
            emit("peer_left", {}, room=room)

    def handle_join_call(data):
        user_id = _authenticated_user_id()
        if not user_id:
            emit("call_error", {"message": "Not authenticated"})
            return

        booking_id = (data or {}).get("booking_id")
        booking = BookingRepository.get_by_id(booking_id) if booking_id else None
        if not booking:
            emit("call_error", {"message": "Booking not found"})
            return
        if not _is_booking_participant(booking, user_id):
            emit("call_error", {"message": "You are not a participant in this booking"})
            return
        if booking.status not in ("accepted", "completed"):
            emit("call_error", {"message": "This session isn't active yet"})
            return

        user = User.objects(id=user_id).first()
        if not user:
            emit("call_error", {"message": "User not found"})
            return

        room = call_service.room_name(booking_id)

        # A reconnecting user replaces their old socket. The other participant
        # is told the peer left, then sees the peer join again.
        stale_sids = call_service.evict_user(room, user_id)
        for old_sid in stale_sids:
            leave_room(room, sid=old_sid)
        if stale_sids:
            emit("peer_left", {}, room=room)

        if call_service.participant_count(room) >= 2:
            emit("call_error", {"message": "This call already has two participants"})
            return

        join_room(room)
        role = "mentor" if str(booking.mentor.id) == str(user_id) else "student"
        call_service.add_participant(room, request.sid, user_id, user.name, role)

        # Tell the newcomer who is already there, so it knows whether to wait
        # or to send the offer.
        peers = call_service.get_peers(room, exclude_sid=request.sid)
        emit("joined_call", {"peers": list(peers.values())})
        emit(
            "peer_joined",
            {"user_id": user_id, "name": user.name, "role": role},
            room=room,
            include_self=False,
        )

    def handle_signal(data):
        if not _authenticated_user_id():
            return
        booking_id = (data or {}).get("booking_id")
        signal = (data or {}).get("signal")
        if not booking_id or signal is None:
            return
        room = call_service.room_name(booking_id)
        # Relay only inside the room, and never back to the sender.
        if request.sid not in call_service.get_peers(room, exclude_sid=None):
            return
        emit("signal", {"signal": signal}, room=room, include_self=False)

    def handle_chat_message(data):
        user_id = _authenticated_user_id()
        if not user_id:
            return
        booking_id = (data or {}).get("booking_id")
        message = ((data or {}).get("message") or "").strip()
        if not booking_id or not message:
            return
        room = call_service.room_name(booking_id)
        if request.sid not in call_service.get_peers(room, exclude_sid=None):
            return
        user = User.objects(id=user_id).first()
        emit(
            "chat_message",
            {"message": message[:1000], "sender_name": user.name if user else "Unknown"},
            room=room,
            include_self=False,
        )

    def handle_leave_call(data):
        booking_id = (data or {}).get("booking_id")
        if booking_id:
            leave_room(call_service.room_name(booking_id))
        room, _ = call_service.remove_participant(request.sid)
        if room:
            emit("peer_left", {}, room=room)

    socketio.on_event("connect", handle_connect)
    socketio.on_event("disconnect", handle_disconnect)
    socketio.on_event("join_call", handle_join_call)
    socketio.on_event("signal", handle_signal)
    socketio.on_event("chat_message", handle_chat_message)
    socketio.on_event("leave_call", handle_leave_call)
