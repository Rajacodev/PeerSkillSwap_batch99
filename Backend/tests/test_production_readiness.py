"""
Tests for deployment safety: production refuses unsafe configuration, the
readiness probe reports the database, API docs can be switched off, and
logging does not duplicate lines when the app is created more than once.
"""
import os

os.environ["FLASK_ENV"] = "testing"
os.environ["MONGODB_URI"] = "mongomock://localhost"

import pytest
from mongoengine.connection import disconnect

from app import create_app
from config import ConfigError, ProductionConfig, TestingConfig, validate_production_config

GOOD_SECRET = "a" * 40


class ProdWithDefaults(ProductionConfig):
    SECRET_KEY = "dev-secret-key"
    JWT_SECRET_KEY = "dev-jwt-secret-key"
    MONGODB_URI = "mongomock://localhost"


class ProdGood(ProductionConfig):
    SECRET_KEY = GOOD_SECRET
    JWT_SECRET_KEY = "b" * 40
    MONGODB_URI = "mongomock://localhost"


class NoDocs(TestingConfig):
    ENABLE_API_DOCS = False


@pytest.fixture(autouse=True)
def _reset_db():
    yield
    disconnect(alias="default")


def test_validator_rejects_example_secrets():
    with pytest.raises(ConfigError) as exc:
        validate_production_config({"SECRET_KEY": "change-me", "JWT_SECRET_KEY": "x" * 40,
                                    "MONGODB_URI": "mongodb://db:27017/x"})
    assert "SECRET_KEY is still an example value" in str(exc.value)


def test_validator_rejects_short_secrets_and_placeholder_uri():
    with pytest.raises(ConfigError) as exc:
        validate_production_config({"SECRET_KEY": "short", "JWT_SECRET_KEY": "y" * 40,
                                    "MONGODB_URI": "mongodb+srv://<username>:<password>@x"})
    message = str(exc.value)
    assert "SECRET_KEY must be at least 32 characters" in message
    assert "MONGODB_URI is missing or still contains placeholder text" in message


def test_validator_reports_every_problem_at_once():
    with pytest.raises(ConfigError) as exc:
        validate_production_config({"SECRET_KEY": "", "JWT_SECRET_KEY": "",
                                    "MONGODB_URI": ""})
    assert str(exc.value).count("\n  - ") == 3


def test_validator_accepts_strong_configuration():
    validate_production_config({"SECRET_KEY": GOOD_SECRET, "JWT_SECRET_KEY": "b" * 40,
                                "MONGODB_URI": "mongodb://db:27017/x"})


def test_production_app_refuses_to_start_with_defaults():
    with pytest.raises(ConfigError):
        create_app(ProdWithDefaults)


def test_production_app_starts_with_strong_secrets():
    app = create_app(ProdGood)
    assert app.config["DEBUG"] is False
    with app.test_client() as client:
        assert client.get("/api/health").status_code == 200


def test_liveness_endpoint_reports_ok():
    client = create_app(TestingConfig).test_client()
    body = client.get("/api/health").get_json()
    assert body["success"] is True


def test_readiness_endpoint_checks_the_database():
    client = create_app(TestingConfig).test_client()
    response = client.get("/api/health/ready")
    assert response.status_code == 200
    assert response.get_json()["message"] == "Ready"


def test_api_docs_can_be_disabled():
    client = create_app(NoDocs).test_client()
    assert client.get("/apidocs/").status_code == 404


def test_api_docs_available_by_default_outside_production():
    client = create_app(TestingConfig).test_client()
    assert client.get("/apidocs/").status_code != 404


def test_logging_handlers_are_not_duplicated():
    import logging
    create_app(TestingConfig)
    create_app(TestingConfig)
    app_logger = logging.getLogger(create_app(TestingConfig).name)
    stream_handlers = [h for h in app_logger.handlers if type(h) is logging.StreamHandler]
    assert len(stream_handlers) == 1
