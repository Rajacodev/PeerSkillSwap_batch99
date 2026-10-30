"""
In-memory tracking of who is connected to each call room (one room per
booking). Only live Socket.IO connections are tracked here, not the database.

Because this state lives in one process, the backend must run as a single
worker (see gunicorn.conf.py). Several workers would each hold a different
view of who is in which room.
"""

# room -> {sid: {"user_id": str, "name": str, "role": str}}
_rooms = {}
# sid -> room, for cleanup on disconnect
_sid_to_room = {}


def room_name(booking_id):
    return f"booking:{booking_id}"


def add_participant(room, sid, user_id, name, role):
    _rooms.setdefault(room, {})[sid] = {"user_id": user_id, "name": name, "role": role}
    _sid_to_room[sid] = room


def _drop(room, sid):
    participants = _rooms.get(room, {})
    participants.pop(sid, None)
    _sid_to_room.pop(sid, None)
    if not participants:
        _rooms.pop(room, None)


def remove_participant(sid):
    """Remove a socket from its room. Returns (room, remaining_peers), or
    (None, {}) if the socket was not in a room."""
    room = _sid_to_room.get(sid)
    if not room:
        return None, {}
    _drop(room, sid)
    return room, dict(_rooms.get(room, {}))


def evict_user(room, user_id):
    """Drop any older connection held by this user in the room, so a page
    refresh or network drop does not count twice against the limit.
    Returns the socket ids that were removed."""
    stale = [sid for sid, info in _rooms.get(room, {}).items() if info["user_id"] == user_id]
    for sid in stale:
        _drop(room, sid)
    return stale


def get_peers(room, exclude_sid=None):
    participants = _rooms.get(room, {})
    return {sid: info for sid, info in participants.items() if sid != exclude_sid}


def participant_count(room):
    return len(_rooms.get(room, {}))
