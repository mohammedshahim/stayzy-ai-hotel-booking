"""Inbound service auth — the mirror of `backend/src/middlewares/requireInternalService.ts`.

`backend/` is the only caller. No browser ever reaches these routes, and no user
session cookie is ever involved.
"""

from hmac import compare_digest
from typing import Annotated

from fastapi import Depends, Header, HTTPException

from src.config.settings import settings


async def require_internal_service(
    x_internal_secret: Annotated[str | None, Header()] = None,
    x_acting_user_id: Annotated[str | None, Header()] = None,
) -> str | None:
    """Verify the shared secret and return the acting user id, if one was sent.

    Constant-time compare so response timing can't leak the secret byte-by-byte.
    The acting user is trusted rather than verified — `backend/` is first-party.
    Optional, because a hotel summary is not scoped to any user.
    """
    if not x_internal_secret or not compare_digest(
        x_internal_secret, settings.internal_service_secret
    ):
        raise HTTPException(status_code=401, detail="Authentication required")

    return x_acting_user_id


ActingUser = Annotated[str | None, Depends(require_internal_service)]
