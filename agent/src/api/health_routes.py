"""Health check route."""

from fastapi import APIRouter
from pydantic import BaseModel

from src.schemas.common import SuccessResponse

router = APIRouter(tags=["health"])


class HealthData(BaseModel):
    """Liveness payload."""

    status: str
    service: str


@router.get("/health", response_model=SuccessResponse[HealthData])
async def health() -> SuccessResponse[HealthData]:
    """Shallow liveness check.

    Makes no downstream call, so it does not prove Postgres, `backend/`, or
    OpenRouter are reachable. Unauthenticated, so a deploy probe can reach it.
    """
    return SuccessResponse(data=HealthData(status="ok", service="stayzy-agent"))
