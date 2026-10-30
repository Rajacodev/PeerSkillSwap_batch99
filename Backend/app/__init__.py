"""
Application factory. Registers extensions, blueprints, and a global error
handler so every endpoint returns the standard API response shape.
"""
import os
from flask import Flask, send_from_directory

from werkzeug.middleware.proxy_fix import ProxyFix

from config import get_config, validate_production_config
from app.extensions import init_extensions, jwt
from app.common.responses import error_response
from app.common.exceptions import AppError
from app.utils.logger import setup_logger


def create_app(config_object=None):
    app = Flask(__name__)
    app.config.from_object(config_object or get_config())

    # Fail fast with a readable message, before touching the database.
    if app.config.get("ENVIRONMENT") == "production":
        validate_production_config(app.config)
    if app.config.get("TRUST_PROXY"):
        # Behind a reverse proxy: take the client IP and HTTPS scheme from X-Forwarded-*.
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    init_extensions(app)
    setup_logger(app)
    register_blueprints(app)
    register_socketio_events()
    register_error_handlers(app)
    register_jwt_callbacks(app)
    register_misc_routes(app)
    register_health_routes(app)

    return app


def register_blueprints(app):
    from app.auth.routes import auth_bp
    from app.users.routes import users_bp
    from app.skills.routes import skills_bp
    from app.skills.bookmarks_routes import bookmarks_bp
    from app.bookings.routes import bookings_bp
    from app.wallet.routes import wallet_bp
    from app.reviews.routes import reviews_bp
    from app.notifications.routes import notifications_bp
    from app.dashboard.routes import dashboard_bp
    from app.admin.routes import admin_bp
    from app.ai.routes import ai_bp
    from app.calls.routes import calls_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(skills_bp)
    app.register_blueprint(bookmarks_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(wallet_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(calls_bp)




def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(err):
        return error_response(err.message, errors=err.errors, status_code=err.status_code)

    @app.errorhandler(404)
    def handle_404(err):
        return error_response("The requested resource was not found", status_code=404)

    @app.errorhandler(405)
    def handle_405(err):
        return error_response("Method not allowed", status_code=405)

    @app.errorhandler(413)
    def handle_413(err):
        return error_response("File too large", status_code=413)

    @app.errorhandler(Exception)
    def handle_generic_error(err):
        app.logger.exception("Unhandled exception: %s", err)
        return error_response("Internal server error", status_code=500)


def register_jwt_callbacks(app):
    from app.auth.routes import BLOCKLIST

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload["jti"] in BLOCKLIST

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Token has expired", status_code=401)

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return error_response("Invalid token", errors=reason, status_code=401)

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return error_response("Missing authorization token", errors=reason, status_code=401)

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return error_response("Token has been revoked", status_code=401)


def register_misc_routes(app):
    @app.route("/")
    def index():
        return {
            "success": True,
            "message": "PeerSkillSwap API is running",
            "docs": "/apidocs/",
        }

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {"success": True, "message": "OK"}

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        upload_dir = os.path.join(os.getcwd(), app.config["UPLOAD_FOLDER"])
        return send_from_directory(upload_dir, filename)


def register_health_routes(app):
    """Liveness (/api/health) only shows the process is up. Readiness
    (/api/health/ready) also checks the database, for load balancers and
    container orchestrators."""
    from mongoengine.connection import get_connection

    @app.route("/api/health/ready", methods=["GET"])
    def readiness_check():
        try:
            get_connection(alias="default").admin.command("ping")
        except Exception:
            app.logger.warning("Readiness check failed: database is unreachable")
            return {"success": False, "message": "Database unavailable"}, 503
        return {"success": True, "message": "Ready"}


def register_socketio_events():
    """Bind the call handlers to the Socket.IO server for this app. Runs on
    every create_app() call; see app/calls/events.py for why."""
    from app.calls.events import register_call_events
    from app.extensions import socketio

    register_call_events(socketio)
