"""
Custom application exceptions. Raised from service/repository layers and
caught centrally by the global error handler registered in app/__init__.py.
"""


class AppError(Exception):
    """Base class for all handled application errors."""
    status_code = 400

    def __init__(self, message="Application error", status_code=None, errors=None):
        super().__init__(message)
        self.message = message
        self.errors = errors
        if status_code is not None:
            self.status_code = status_code


class ValidationError(AppError):
    status_code = 422

    def __init__(self, message="Validation failed", errors=None):
        super().__init__(message, status_code=422, errors=errors)


class NotFoundError(AppError):
    status_code = 404

    def __init__(self, message="Resource not found"):
        super().__init__(message, status_code=404)


class UnauthorizedError(AppError):
    status_code = 401

    def __init__(self, message="Unauthorized"):
        super().__init__(message, status_code=401)


class ForbiddenError(AppError):
    status_code = 403

    def __init__(self, message="Forbidden"):
        super().__init__(message, status_code=403)


class ConflictError(AppError):
    status_code = 409

    def __init__(self, message="Conflict"):
        super().__init__(message, status_code=409)


class InsufficientCreditsError(AppError):
    status_code = 402

    def __init__(self, message="Insufficient wallet credits"):
        super().__init__(message, status_code=402)
