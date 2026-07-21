"""Single-shot comparison of two to four hotels. No graph, no checkpointer, no state."""

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from src.chains.summary.prompts import COMPARE_SUMMARY_HOTEL, COMPARE_SUMMARY_SYSTEM
from src.config.llm import get_fast_llm
from src.config.settings import settings
from src.schemas.summary import CompareHotel, CompareSummaryRequest, HotelSummaryData

logger = logging.getLogger(__name__)

# Too small a ceiling returns empty content, not short content — see hotel_summary_chain.
MAX_TOKENS = 900


def _format_hotel(hotel: CompareHotel) -> str:
    cancellation = (
        f"free cancellation — {hotel.cancellation_policy}"
        if hotel.free_cancellation
        else hotel.cancellation_policy
    )
    guest_rating = (
        f"{hotel.average_rating} out of 5, from {hotel.review_count} reviews"
        if hotel.review_count > 0
        else "no reviews yet"
    )
    return COMPARE_SUMMARY_HOTEL.format(
        name=hotel.name,
        city=hotel.city,
        country=hotel.country,
        star_rating=hotel.star_rating,
        amenities=", ".join(hotel.amenities) or "none listed",
        cancellation=cancellation,
        guest_rating=guest_rating,
    )


async def generate_compare_summary(request: CompareSummaryRequest) -> HotelSummaryData:
    """Returns an empty summary rather than raising — `backend/` treats that as a failure."""
    llm = get_fast_llm().bind(max_tokens=MAX_TOKENS)

    messages = [
        SystemMessage(content=COMPARE_SUMMARY_SYSTEM),
        HumanMessage(content="\n".join(_format_hotel(hotel) for hotel in request.hotels)),
    ]

    response = await llm.ainvoke(messages)
    summary = str(response.content).strip()

    if not summary:
        logger.warning(
            "[chains/summary] model returned no content comparing %s",
            ", ".join(hotel.name for hotel in request.hotels),
        )

    return HotelSummaryData(summary=summary, model=settings.openrouter_model_fast)
