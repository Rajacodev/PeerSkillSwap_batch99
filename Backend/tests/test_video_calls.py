"""
Tests for the video-call signalling layer (app/calls/events.py).

These run the real Socket.IO handlers through Flask-SocketIO's test client,
so no browser or network is needed. What they check is the signalling logic:
authentication, room membership, the two-person limit, reconnection, and relay.
The WebRTC media negotiation itself happens in the browser and is not tested here.
"""
import datetime
import os

os.environ["FLASK_ENV"] = "testing"
os.environ["MONGODB_URI"] = "mongomock://localhost"

import pytest
from flask_socketio import SocketIOTestClient
from mongoengine.connection import disconnect

from app import create_app
from app.extensions import socketio
from config import TestingConfig


@pytest.fixture()
def app():
    flask_app = create_app(TestingConfig)
    yield flask_app
    disconnect(alias="default")


@pytest.fixture()
def client(app):
    return app.test_client()


def register(client, email, role):
    return client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": email, "password": "password123", "role": role},
    ).get_json()["data"]


def accepted_booking(client, mentor_token, student_token):
    mh = {"Authorization": f"Bearer {mentor_token}"}
    sh = {"Authorization": f"Bearer {student_token}"}
    skill = client.post(
        "/api/skills",
        json={"title": "Guitar Lessons", "description": "Learn to play guitar basics",
              "credits_per_session": 1},
        headers=mh,
    ).get_json()["data"]
    scheduled = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat() + "Z"
    booking = client.post(
        "/api/bookings", json={"skill_id": skill["id"], "scheduled_at": scheduled}, headers=sh,
    ).get_json()["data"]
    client.patch(f"/api/bookings/{booking['id']}/accept", json={}, headers=mh)
    return booking["id"]


_inbox = {}


def events(socket, name):
    """All events of this name the socket has received so far. Events are
    cached per socket, so checking one name does not hide another."""
    _inbox.setdefault(id(socket), []).extend(socket.get_received())
    return [e["args"][0] if e["args"] else {} for e in _inbox[id(socket)] if e["name"] == name]


@pytest.fixture()
def pair(app, client):
    """A mentor and a student with an accepted booking, ready to call."""
    mentor = register(client, "call_mentor@test.com", "mentor")
    student = register(client, "call_student@test.com", "student")
    booking_id = accepted_booking(client, mentor["access_token"], student["access_token"])
    return {"booking_id": booking_id, "mentor": mentor, "student": student}


def test_ice_servers_endpoint_requires_auth(client):
    assert client.get("/api/calls/ice-servers").status_code == 401


def test_ice_servers_endpoint_returns_stun(client):
    token = register(client, "icecheck@test.com", "student")["access_token"]
    r = client.get("/api/calls/ice-servers", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert any("stun:" in s["urls"] for s in r.get_json()["data"]["ice_servers"])


def test_connect_rejected_without_token(app):
    assert SocketIOTestClient(app, socketio, auth={}).is_connected() is False


def test_connect_rejected_with_invalid_token(app):
    assert SocketIOTestClient(app, socketio, auth={"token": "not-a-token"}).is_connected() is False


def test_refresh_token_cannot_open_a_call_socket(app, pair):
    refresh = pair["mentor"]["refresh_token"]
    assert SocketIOTestClient(app, socketio, auth={"token": refresh}).is_connected() is False


def test_full_signalling_flow(app, pair):
    booking_id = pair["booking_id"]
    mentor = SocketIOTestClient(app, socketio, auth={"token": pair["mentor"]["access_token"]})
    student = SocketIOTestClient(app, socketio, auth={"token": pair["student"]["access_token"]})

    mentor.emit("join_call", {"booking_id": booking_id})
    assert events(mentor, "joined_call")[0]["peers"] == []

    student.emit("join_call", {"booking_id": booking_id})
    joined = events(student, "joined_call")[0]["peers"]
    assert len(joined) == 1 and joined[0]["role"] == "mentor"
    assert events(mentor, "peer_joined")[0]["role"] == "student"

    student.emit("signal", {"booking_id": booking_id, "signal": {"type": "offer", "sdp": "x"}})
    assert events(mentor, "signal")[0]["signal"]["type"] == "offer"
    assert events(student, "signal") == []  # never echoed back to the sender

    mentor.emit("chat_message", {"booking_id": booking_id, "message": "Can you hear me?"})
    chat = events(student, "chat_message")[0]
    assert chat["message"] == "Can you hear me?" and chat["sender_name"] == "Test User"

    mentor.emit("leave_call", {"booking_id": booking_id})
    assert events(student, "peer_left") != []


def test_non_participant_cannot_join(app, pair, client):
    outsider = register(client, "call_outsider@test.com", "student")
    socket = SocketIOTestClient(app, socketio, auth={"token": outsider["access_token"]})
    socket.emit("join_call", {"booking_id": pair["booking_id"]})
    assert "not a participant" in events(socket, "call_error")[0]["message"]


def test_second_tab_takes_over_and_old_tab_is_ignored(app, pair):
    booking_id = pair["booking_id"]
    mentor = SocketIOTestClient(app, socketio, auth={"token": pair["mentor"]["access_token"]})
    first_tab = SocketIOTestClient(app, socketio, auth={"token": pair["student"]["access_token"]})
    mentor.emit("join_call", {"booking_id": booking_id})
    first_tab.emit("join_call", {"booking_id": booking_id})

    # The same student opens a second tab. The newer tab takes over the seat.
    second_tab = SocketIOTestClient(app, socketio, auth={"token": pair["student"]["access_token"]})
    second_tab.emit("join_call", {"booking_id": booking_id})
    assert events(second_tab, "call_error") == []
    assert events(second_tab, "joined_call")[0]["peers"][0]["role"] == "mentor"

    # Signals from the replaced tab must no longer reach the mentor.
    first_tab.emit("signal", {"booking_id": booking_id, "signal": {"type": "offer", "sdp": "stale"}})
    assert events(mentor, "signal") == []

    second_tab.emit("signal", {"booking_id": booking_id, "signal": {"type": "offer", "sdp": "fresh"}})
    assert events(mentor, "signal")[0]["signal"]["sdp"] == "fresh"


def test_pending_booking_cannot_be_joined(app, client):
    mentor = register(client, "call_mentor4@test.com", "mentor")
    student = register(client, "call_student4@test.com", "student")
    skill = client.post(
        "/api/skills",
        json={"title": "Painting", "description": "Learn watercolor painting basics",
              "credits_per_session": 1},
        headers={"Authorization": f"Bearer {mentor['access_token']}"},
    ).get_json()["data"]
    scheduled = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat()
    booking = client.post(
        "/api/bookings", json={"skill_id": skill["id"], "scheduled_at": scheduled},
        headers={"Authorization": f"Bearer {student['access_token']}"},
    ).get_json()["data"]
    socket = SocketIOTestClient(app, socketio, auth={"token": student["access_token"]})
    socket.emit("join_call", {"booking_id": booking["id"]})
    assert "isn't active yet" in events(socket, "call_error")[0]["message"]
