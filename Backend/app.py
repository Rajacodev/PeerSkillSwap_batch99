"""
Development server entry point: `python app.py`.

Uses socketio.run() because the app also serves Socket.IO connections for
video-call signalling. Production runs Gunicorn with wsgi.py instead.
"""
import os

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=app.config.get("DEBUG", False),
        allow_unsafe_werkzeug=True,
    )
