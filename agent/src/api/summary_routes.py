"""Summary generation routes."""

from fastapi import APIRouter

from src.api.deps import ActingUser
from src.chains.summary.hotel_summary_chain import generate_hotel_summary
from src.schemas.common import SuccessResponse
from src.schemas.summary import HotelSummaryData, HotelSummaryRequest

router = APIRouter(prefix="/summary", tags=["summary"])


@router.post("/hotel", response_model=SuccessResponse[HotelSummaryData])
async def hotel_summary(
    body: HotelSummaryRequest,
    _acting_user: ActingUser,
) -> SuccessResponse[HotelSummaryData]:
    """Write a summary for one hotel. Hotel-scoped, so no acting user is required."""
    data = await generate_hotel_summary(body)
    return SuccessResponse(data=data)
