"""
Helper functions for handling profile picture uploads.
"""
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app


def allowed_file(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_EXTENSIONS"]


def save_uploaded_file(file_storage, subfolder="profile_pictures"):
    """Save an uploaded file with a unique name and return its relative URL path."""
    if not file_storage or file_storage.filename == "":
        return None
    if not allowed_file(file_storage.filename):
        raise ValueError("Unsupported file type")

    filename = secure_filename(file_storage.filename)
    ext = filename.rsplit(".", 1)[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(folder, exist_ok=True)

    full_path = os.path.join(folder, unique_name)
    file_storage.save(full_path)

    return f"/uploads/{subfolder}/{unique_name}"
