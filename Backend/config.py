"""
Application configuration, loaded from environment variables.

The environment is chosen with FLASK_ENV (development | testing | production).
Production adds safety checks: see validate_production_config().
"""
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

# Example values copied from .env.example. Production refuses to start while
# any of these (or any secret shorter than 32 characters) is still in use.
PLACEHOLDER_SECRETS = {
    "change-me",
    "dev-secret-key",
    "dev-jwt-secret-key",
    "change-this-super-secret-key",
    "change-this-jwt-secret-key",
}


def _bool(name, default):
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


def _list(name, default):
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


class Config:
    """Settings shared by every environment."""

    ENVIRONMENT = "development"

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    # MongoDB
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/peerskillswap")
    MONGODB_DB = os.getenv("MONGODB_DB", "peerskillswap")

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 60))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", 30))
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # CORS: only used for cross-origin browser calls. The Docker setup serves
    # the frontend and API from one origin, so this list stays short.
    CORS_ORIGINS = _list("CORS_ORIGINS", "http://localhost:5173")

    # Uploads
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH_MB", 5)) * 1024 * 1024
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

    # Mail (mock: messages are written to the log, nothing is sent)
    MAIL_SENDER = os.getenv("MAIL_SENDER", "no-reply@peerskillswap.com")

    # Business rules
    DEFAULT_SIGNUP_CREDITS = int(os.getenv("DEFAULT_SIGNUP_CREDITS", 10))

    # WebRTC video calls. STUN is always used. TURN is optional, but it is
    # needed on networks that block direct peer-to-peer traffic.
    TURN_SERVER_URL = os.getenv("TURN_SERVER_URL", "")
    TURN_USERNAME = os.getenv("TURN_USERNAME", "")
    TURN_CREDENTIAL = os.getenv("TURN_CREDENTIAL", "")

    # AI Career Advisor. Providers with a key are tried in AI_PROVIDER_ORDER;
    # if none are configured or all fail, a curated dataset is used instead.
    AI_PROVIDER_ORDER = os.getenv("AI_PROVIDER_ORDER", "anthropic,openai,gemini,groq")
    AI_REQUEST_TIMEOUT = int(os.getenv("AI_REQUEST_TIMEOUT", 20))
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # Operations
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    LOG_TO_FILE = _bool("LOG_TO_FILE", True)
    ENABLE_API_DOCS = _bool("ENABLE_API_DOCS", True)
    # Set only when a reverse proxy you control sits in front of the app, so
    # that client IPs and HTTPS detection come from X-Forwarded-* headers.
    TRUST_PROXY = _bool("TRUST_PROXY", False)

    # Swagger
    SWAGGER = {
        "title": "PeerSkillSwap API",
        "uiversion": 3,
        "specs_route": "/apidocs/",
    }


class DevelopmentConfig(Config):
    ENVIRONMENT = "development"
    DEBUG = True


class ProductionConfig(Config):
    ENVIRONMENT = "production"
    DEBUG = False
    ENABLE_API_DOCS = _bool("ENABLE_API_DOCS", False)


class TestingConfig(Config):
    ENVIRONMENT = "testing"
    TESTING = True
    # Tests never call real AI APIs, even if keys exist in the environment.
    ANTHROPIC_API_KEY = ""
    OPENAI_API_KEY = ""
    GEMINI_API_KEY = ""
    GROQ_API_KEY = ""
    MONGODB_DB = "peerskillswap_test"
    MONGODB_URI = os.getenv("MONGODB_TEST_URI", "mongomock://localhost")


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


class ConfigError(RuntimeError):
    """Raised when the configuration is unsafe for the requested environment."""


def validate_production_config(config):
    """Refuse to run production with example secrets or a missing database.

    Collects every problem before failing so they can all be fixed at once.
    """
    problems = []
    for key in ("SECRET_KEY", "JWT_SECRET_KEY"):
        value = config.get(key) or ""
        if value in PLACEHOLDER_SECRETS:
            problems.append(f"{key} is still an example value. Generate a new random one.")
        elif len(value) < 32:
            problems.append(f"{key} must be at least 32 characters long.")

    uri = config.get("MONGODB_URI") or ""
    if not uri or "<" in uri or ">" in uri:
        problems.append("MONGODB_URI is missing or still contains placeholder text.")

    if problems:
        raise ConfigError(
            "Refusing to start in production:\n  - " + "\n  - ".join(problems)
        )


def get_config():
    env = os.getenv("FLASK_ENV", "development")
    return config_by_name.get(env, DevelopmentConfig)
