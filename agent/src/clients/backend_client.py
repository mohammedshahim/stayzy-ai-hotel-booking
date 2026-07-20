"""The only place outbound HTTP happens.

Tools, chains, and graphs call `get`/`post` here — never `httpx` directly — so
the internal service secret is attached in exactly one place.

`backend/` wraps every response in `{success, data?, error?}`. These functions
return the unwrapped `data`, or raise, so callers never inspect the envelope.
"""

from typing import Any

import httpx

from src.config.settings import settings


class BackendError(RuntimeError):
    """A call to `backend/` failed, or came back with `success: false`."""


# The x-internal-secret / x-acting-user-id pair is what requireInternalService.ts
# checks (Feature 37). Public backend routes ignore it harmlessly.
client = httpx.AsyncClient(
    base_url=settings.backend_internal_url,
    timeout=settings.backend_request_timeout_seconds,
    headers={"x-internal-secret": settings.internal_service_secret},
)


async def get(
    path: str, *, user_id: str | None = None, params: dict[str, Any] | None = None
) -> Any:
    """GET `path` and return the unwrapped `data`."""
    return await _request("GET", path, user_id=user_id, params=params)


async def post(path: str, *, user_id: str | None = None, json: dict[str, Any] | None = None) -> Any:
    """POST `path` and return the unwrapped `data`."""
    return await _request("POST", path, user_id=user_id, json=json)


async def close() -> None:
    """Close the connection pool. Called on app shutdown."""
    await client.aclose()


async def _request(
    method: str,
    path: str,
    *,
    user_id: str | None = None,
    params: dict[str, Any] | None = None,
    json: dict[str, Any] | None = None,
) -> Any:
    headers = {"x-acting-user-id": user_id} if user_id else None

    try:
        response = await client.request(method, path, params=params, json=json, headers=headers)
        payload = response.json()
    except httpx.HTTPError as exc:
        raise BackendError(f"[clients/backend_client] {method} {path} failed: {exc}") from exc
    except ValueError as exc:
        raise BackendError(
            f"[clients/backend_client] {method} {path} returned non-JSON "
            f"(status {response.status_code})"
        ) from exc

    if not isinstance(payload, dict) or not payload.get("success"):
        error = payload.get("error", "unknown error") if isinstance(payload, dict) else "unknown"
        raise BackendError(
            f"[clients/backend_client] {method} {path} -> {response.status_code}: {error}"
        )

    return payload.get("data")
