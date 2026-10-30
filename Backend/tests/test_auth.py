"""
Basic test suite covering auth, skills, and booking flows.
Run with: pytest
"""
import os
import datetime
import pytest

os.environ["FLASK_ENV"] = "testing"
os.environ["MONGODB_URI"] = "mongomock://localhost"

from app import create_app
from config import TestingConfig
from mongoengine.connection import disconnect


@pytest.fixture()
def client():
    app = create_app(TestingConfig)
    with app.test_client() as client:
        yield client
    disconnect(alias="default")


def register(client, email, role):
    return client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": email, "password": "password123", "role": role},
    )


def test_register_and_login(client):
    r = register(client, "user1@test.com", "student")
    assert r.status_code == 201
    assert r.get_json()["data"]["access_token"]

    r = client.post(
        "/api/auth/login", json={"email": "user1@test.com", "password": "password123"}
    )
    assert r.status_code == 200


def test_duplicate_registration_fails(client):
    register(client, "dup@test.com", "student")
    r = register(client, "dup@test.com", "student")
    assert r.status_code == 409


def test_skill_creation_requires_mentor_role(client):
    r = register(client, "student2@test.com", "student")
    token = r.get_json()["data"]["access_token"]
    r = client.post(
        "/api/skills",
        json={"title": "Guitar Lessons", "description": "Learn to play guitar basics"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


def test_full_booking_lifecycle(client):
    mentor_resp = register(client, "mentor2@test.com", "mentor")
    mentor_token = mentor_resp.get_json()["data"]["access_token"]
    student_resp = register(client, "student3@test.com", "student")
    student_token = student_resp.get_json()["data"]["access_token"]

    mh = {"Authorization": f"Bearer {mentor_token}"}
    sh = {"Authorization": f"Bearer {student_token}"}

    r = client.post(
        "/api/skills",
        json={"title": "Guitar Lessons", "description": "Learn to play guitar basics",
              "credits_per_session": 3},
        headers=mh,
    )
    assert r.status_code == 201
    skill_id = r.get_json()["data"]["id"]

    scheduled = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat()
    r = client.post(
        "/api/bookings",
        json={"skill_id": skill_id, "scheduled_at": scheduled},
        headers=sh,
    )
    assert r.status_code == 201
    booking_id = r.get_json()["data"]["id"]

    r = client.patch(f"/api/bookings/{booking_id}/accept", headers=mh)
    assert r.status_code == 200
    assert r.get_json()["data"]["status"] == "accepted"

    r = client.patch(f"/api/bookings/{booking_id}/complete", headers=mh)
    assert r.status_code == 200
    assert r.get_json()["data"]["status"] == "completed"

    r = client.get("/api/wallet", headers=sh)
    assert r.get_json()["data"]["balance"] == 7  # 10 - 3

    r = client.get("/api/wallet", headers=mh)
    assert r.get_json()["data"]["balance"] == 13  # 10 + 3


def test_insufficient_credits_blocks_booking(client):
    mentor_resp = register(client, "mentor3@test.com", "mentor")
    mentor_token = mentor_resp.get_json()["data"]["access_token"]
    student_resp = register(client, "student4@test.com", "student")
    student_token = student_resp.get_json()["data"]["access_token"]

    mh = {"Authorization": f"Bearer {mentor_token}"}
    sh = {"Authorization": f"Bearer {student_token}"}

    r = client.post(
        "/api/skills",
        json={"title": "Expensive Skill", "description": "Costs a lot of credits",
              "credits_per_session": 999},
        headers=mh,
    )
    skill_id = r.get_json()["data"]["id"]

    scheduled = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat()
    r = client.post(
        "/api/bookings",
        json={"skill_id": skill_id, "scheduled_at": scheduled},
        headers=sh,
    )
    assert r.status_code == 409


def test_booking_accepts_timezone_aware_iso_datetime(client):
    """
    Regression test: the frontend sends scheduled_at as the output of
    JS Date.toISOString(), e.g. '2026-07-25T08:41:00.000Z' — a
    timezone-aware ISO string. Marshmallow parses this into an aware
    datetime, which must not be compared directly against the naive
    datetime.utcnow() used elsewhere, or it raises TypeError and surfaces
    as a 500 Internal Server Error.
    """
    mentor_resp = register(client, "mentor4@test.com", "mentor")
    mentor_token = mentor_resp.get_json()["data"]["access_token"]
    student_resp = register(client, "student5@test.com", "student")
    student_token = student_resp.get_json()["data"]["access_token"]

    mh = {"Authorization": f"Bearer {mentor_token}"}
    sh = {"Authorization": f"Bearer {student_token}"}

    r = client.post(
        "/api/skills",
        json={"title": "Guitar Lessons", "description": "Learn to play guitar basics",
              "credits_per_session": 2},
        headers=mh,
    )
    skill_id = r.get_json()["data"]["id"]

    # Timezone-aware ISO string with 'Z' suffix, exactly as JS toISOString() produces
    scheduled = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat() + "Z"
    r = client.post(
        "/api/bookings",
        json={"skill_id": skill_id, "scheduled_at": scheduled},
        headers=sh,
    )
    assert r.status_code == 201
    assert r.get_json()["data"]["status"] == "pending"


def test_meeting_link_on_accept_and_update(client):
    mentor_resp = register(client, "mentor5@test.com", "mentor")
    mentor_token = mentor_resp.get_json()["data"]["access_token"]
    student_resp = register(client, "student6@test.com", "student")
    student_token = student_resp.get_json()["data"]["access_token"]

    mh = {"Authorization": f"Bearer {mentor_token}"}
    sh = {"Authorization": f"Bearer {student_token}"}

    r = client.post(
        "/api/skills",
        json={"title": "Spanish Conversation", "description": "Practice conversational Spanish",
              "credits_per_session": 1},
        headers=mh,
    )
    skill_id = r.get_json()["data"]["id"]

    scheduled = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat()
    r = client.post(
        "/api/bookings",
        json={"skill_id": skill_id, "scheduled_at": scheduled},
        headers=sh,
    )
    booking_id = r.get_json()["data"]["id"]

    # Reject an invalid (non-http) meeting link
    r = client.patch(
        f"/api/bookings/{booking_id}/accept",
        json={"meeting_link": "not-a-url"},
        headers=mh,
    )
    assert r.status_code == 422

    # Accept with a valid Zoom-style link
    r = client.patch(
        f"/api/bookings/{booking_id}/accept",
        json={"meeting_link": "https://zoom.us/j/1234567890"},
        headers=mh,
    )
    assert r.status_code == 200
    assert r.get_json()["data"]["meeting_link"] == "https://zoom.us/j/1234567890"
    assert r.get_json()["data"]["status"] == "accepted"

    # Student sees the link when fetching their bookings
    r = client.get("/api/bookings/student", headers=sh)
    assert r.get_json()["data"][0]["meeting_link"] == "https://zoom.us/j/1234567890"

    # Mentor updates the link later
    r = client.patch(
        f"/api/bookings/{booking_id}/meeting-link",
        json={"meeting_link": "https://meet.google.com/abc-defg-hij"},
        headers=mh,
    )
    assert r.status_code == 200
    assert r.get_json()["data"]["meeting_link"] == "https://meet.google.com/abc-defg-hij"

    # Student cannot set the meeting link (mentor-only action)
    r = client.patch(
        f"/api/bookings/{booking_id}/meeting-link",
        json={"meeting_link": "https://meet.google.com/xyz"},
        headers=sh,
    )
    assert r.status_code == 403
