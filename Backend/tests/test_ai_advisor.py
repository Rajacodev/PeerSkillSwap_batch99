"""
Tests for the AI Career Advisor feature. These exercise the fallback (no
API key) path, since real Anthropic API calls are not made in tests. The
fallback is also exactly what runs by default (ANTHROPIC_API_KEY is empty
unless explicitly configured).
"""
import os
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


def auth(client, email, role="student"):
    token = register(client, email, role).get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_recommend_skills_requires_auth(client):
    r = client.post("/api/ai/recommend-skills", json={"job_title": "Software Engineer"})
    assert r.status_code == 401


def test_recommend_skills_validates_job_title(client):
    h = auth(client, "advisor1@test.com")
    assert client.post("/api/ai/recommend-skills", json={"job_title": "x"}, headers=h).status_code == 422
    assert client.post("/api/ai/recommend-skills", json={}, headers=h).status_code == 422


def test_recommend_skills_known_role_uses_curated_data(client):
    h = auth(client, "advisor2@test.com")
    r = client.post("/api/ai/recommend-skills", json={"job_title": "Software Engineer"}, headers=h)
    assert r.status_code == 201
    data = r.get_json()["data"]
    assert data["job_title"] == "Software Engineer"
    assert data["generated_by_ai"] is False
    assert any(s["name"] == "Python" for s in data["recommended_skills"])


def test_recommend_skills_unknown_role_uses_generic_fallback(client):
    h = auth(client, "advisor3@test.com")
    r = client.post(
        "/api/ai/recommend-skills", json={"job_title": "Underwater Basket Weaver"}, headers=h
    )
    assert r.status_code == 201
    assert any(s["name"] == "Communication" for s in r.get_json()["data"]["recommended_skills"])


def test_recommendation_links_to_matching_platform_skill(client):
    mh = auth(client, "advisor_mentor@test.com", "mentor")
    client.post(
        "/api/skills",
        json={
            "title": "Python for Beginners",
            "description": "Learn python basics step by step",
            "category": "Technology",
            "credits_per_session": 2,
        },
        headers=mh,
    )
    h = auth(client, "advisor4@test.com")
    r = client.post("/api/ai/recommend-skills", json={"job_title": "Software Engineer"}, headers=h)
    python_rec = next(s for s in r.get_json()["data"]["recommended_skills"] if s["name"] == "Python")
    assert len(python_rec["matching_platform_skills"]) == 1
    assert python_rec["matching_platform_skills"][0]["title"] == "Python for Beginners"


def test_recommendation_history(client):
    h = auth(client, "advisor5@test.com")
    client.post("/api/ai/recommend-skills", json={"job_title": "Data Analyst"}, headers=h)
    client.post("/api/ai/recommend-skills", json={"job_title": "UX Designer"}, headers=h)
    r = client.get("/api/ai/recommendations", headers=h)
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert [d["job_title"] for d in data] == ["UX Designer", "Data Analyst"]
