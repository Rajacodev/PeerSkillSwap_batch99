"""
Centralized initialization of Flask extensions.
Kept in one module to avoid circular imports across blueprints.
"""
import re
import sys

from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flasgger import Swagger
from flask_socketio import SocketIO
from mongoengine import connect, disconnect
from pymongo.errors import PyMongoError

bcrypt = Bcrypt()
jwt = JWTManager()
cors = CORS()
swagger = Swagger()
# Threading mode works with the Gunicorn gthread worker used in production
# (see gunicorn.conf.py). WebSockets need the simple-websocket package.
socketio = SocketIO(async_mode="threading")

# Any of these substrings in MONGODB_URI mean the .env.example placeholder
# was never replaced with a real connection string.
_PLACEHOLDER_MARKERS = ("<username>", "<password>", "cluster0.mongodb.net")

# In development, accept requests from any localhost, 127.0.0.1 or private
# LAN address on any port. That covers Vite choosing another port, or testing
# from a phone on the same Wi-Fi, without listing every origin by hand.
_DEV_CORS_ORIGIN_REGEX = re.compile(
    r"^https?://("
    r"localhost"
    r"|127\.0\.0\.1"
    r"|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|192\.168\.\d{1,3}\.\d{1,3}"
    r"|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$"
)


def _dev_origin_allowed(origin, environ=None):
    """Same rule as _DEV_CORS_ORIGIN_REGEX, as a callable. Socket.IO accepts
    a callable for cors_allowed_origins, but not a compiled regex."""
    return bool(origin) and bool(_DEV_CORS_ORIGIN_REGEX.match(origin))


def init_db(app):
    """Connect MongoEngine to MongoDB (Atlas or local).

    Fails fast with a clear message if MONGODB_URI still contains the
    .env.example placeholder, or if the server cannot be reached.
    """
    disconnect(alias="default")
    uri = app.config["MONGODB_URI"]

    if uri.startswith("mongomock://"):
        import mongomock

        connect(
            db=app.config["MONGODB_DB"],
            host=uri.replace("mongomock://", "mongodb://"),
            alias="default",
            mongo_client_class=mongomock.MongoClient,
        )
        return

    if any(marker in uri for marker in _PLACEHOLDER_MARKERS):
        print(
            "\n"
            "==============================================================\n"
            " MONGODB_URI is still set to the .env.example placeholder.\n"
            " The app cannot start until this is a real connection string.\n"
            "\n"
            " Fix this in Backend/.env, either:\n"
            "   1) MongoDB Atlas: copy the real connection string from\n"
            "      https://cloud.mongodb.com (Connect > Drivers), with your\n"
            "      actual database username and password.\n"
            "   2) Local MongoDB (simplest for local development):\n"
            "        MONGODB_URI=mongodb://localhost:27017/peerskillswap\n"
            "==============================================================\n",
            file=sys.stderr,
        )
        raise RuntimeError(
            "MONGODB_URI is still the placeholder from .env.example. "
            "Set a real MongoDB connection string in Backend/.env before starting the app."
        )

    connect(
        db=app.config["MONGODB_DB"],
        host=uri,
        alias="default",
        serverSelectionTimeoutMS=8000,
    )

    try:
        from mongoengine.connection import get_connection

        get_connection(alias="default").admin.command("ping")
    except PyMongoError as exc:
        print(
            "\n"
            "==============================================================\n"
            " Could not connect to MongoDB using the MONGODB_URI in .env.\n"
            f" Underlying error: {exc}\n"
            "\n"
            " Common causes:\n"
            "   - Wrong username or password in the connection string\n"
            "   - Your current IP is not allowed in Atlas Network Access\n"
            "   - A local MongoDB server is not running\n"
            "     (start one with: docker run -d -p 27017:27017 mongo)\n"
            "==============================================================\n",
            file=sys.stderr,
        )
        raise RuntimeError(f"Failed to connect to MongoDB: {exc}") from exc


def init_extensions(app):
    """Attach all extensions to the Flask app instance."""
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Development accepts any local or LAN origin. Production uses the exact
    # CORS_ORIGINS list, which is the real security boundary.
    is_dev = app.config.get("DEBUG")
    flask_cors_origins = _DEV_CORS_ORIGIN_REGEX if is_dev else app.config["CORS_ORIGINS"]
    socketio_cors_origins = _dev_origin_allowed if is_dev else app.config["CORS_ORIGINS"]

    cors.init_app(app, resources={r"/api/*": {"origins": flask_cors_origins}})
    if app.config.get("ENABLE_API_DOCS"):
        swagger.init_app(app)
    socketio.init_app(app, cors_allowed_origins=socketio_cors_origins)
    init_db(app)
