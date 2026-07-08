"""Custom exception classes for RailMind AI."""


class RailMindError(Exception):
    """Base exception for all RailMind AI errors."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        self.message = message
        self.detail = detail
        super().__init__(self.message)


class NotFoundError(RailMindError):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str, identifier: str) -> None:
        super().__init__(
            message=f"{resource} not found",
            detail=f"{resource} with identifier '{identifier}' does not exist.",
        )


class UnauthorizedError(RailMindError):
    """Raised when authentication fails or is missing."""

    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(message=message)


class ForbiddenError(RailMindError):
    """Raised when the user lacks permission for the requested action."""

    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(message=message)


class ValidationError(RailMindError):
    """Raised when request data fails validation."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(message=message, detail=detail)


class ConflictError(RailMindError):
    """Raised when a resource conflict occurs (e.g., duplicate entry)."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(message=message, detail=detail)
