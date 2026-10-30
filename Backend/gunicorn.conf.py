"""
Gunicorn settings for production (used by the Dockerfile).

Exactly ONE worker process. Video-call rooms are held in memory
(app/calls/service.py), so a second process would not see the same rooms.
Concurrency comes from threads instead.
"""
import os

bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
workers = 1
worker_class = "gthread"
threads = int(os.getenv("GUNICORN_THREADS", "16"))
timeout = 120
graceful_timeout = 30
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info").lower()
