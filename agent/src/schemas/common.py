"""The response envelope, shared with `backend/`."""

from pydantic import BaseModel


class SuccessResponse[T](BaseModel):
    """`{success: true, data: ...}` — the shape every successful route returns."""

    success: bool = True
    data: T
