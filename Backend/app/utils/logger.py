"""
Application logging. Logs always go to stdout, which is what container
platforms collect. A rotating file is also written when LOG_TO_FILE is set.

Safe to call more than once per process: handlers are attached only once,
so repeated app creation (tests, reloads) does not duplicate log lines.
"""
import logging
import os
from logging.handlers import RotatingFileHandler

from flask.logging import default_handler

LOG_FORMAT = "[%(asctime)s] %(levelname)s %(name)s in %(module)s: %(message)s"
_CONFIGURED_FLAG = "_peerskillswap_configured"


def setup_logger(app):
    logger = app.logger
    level = getattr(logging, str(app.config.get("LOG_LEVEL", "INFO")), logging.INFO)
    logger.setLevel(level)

    if getattr(logger, _CONFIGURED_FLAG, False):
        return

    # Flask adds its own default handler; ours replaces it so each line prints once.
    logger.removeHandler(default_handler)
    formatter = logging.Formatter(LOG_FORMAT)

    stream = logging.StreamHandler()
    stream.setFormatter(formatter)
    logger.addHandler(stream)

    if app.config.get("LOG_TO_FILE"):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        log_dir = os.path.join(project_root, "logs")
        os.makedirs(log_dir, exist_ok=True)
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, "app.log"), maxBytes=5_000_000, backupCount=5
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    setattr(logger, _CONFIGURED_FLAG, True)
    logger.info("Logging configured (level=%s)", logging.getLevelName(level))
