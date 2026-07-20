"""Central error handling.

Every error leaves in the same `{success, error}` envelope `backend/` uses.
A raw exception string never reaches a client.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


async def _http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Known, intentional client errors keep their status and message."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": str(exc.detail)},
    )


async def _validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """A malformed request body is a client error, not a 500."""
    logger.warning("[middlewares/error_handler] request validation failed: %s", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": "Invalid request"},
    )


async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Anything unexpected is a 500 with a generic message."""
    logger.exception("[%s %s] unhandled error: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Something went wrong"},
    )


def register_error_handlers(app: FastAPI) -> None:
    """Attach every handler to `app`."""
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _unhandled_exception_handler)
