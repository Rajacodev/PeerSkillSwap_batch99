"""
WSGI entry point for Gunicorn (used by the Dockerfile).

Named wsgi.py rather than app.py because `app` is also the package folder;
`gunicorn app:app` would load the package instead of this object.
"""
from app import create_app

app = create_app()
