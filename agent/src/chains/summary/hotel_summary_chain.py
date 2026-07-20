"""Single-shot hotel summary generation. No graph, no checkpointer, no state."""

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from src.chains.summary.prompts import HOTEL_SUMMARY_SYSTEM, HOTEL_SUMMARY_USER
from src.config.llm import get_fast_llm
from src.config.settings import settings
from src.schemas.summary import HotelSummaryData, HotelSummaryRequest

logger = logging.getLogger(__name__)

# The configured model reasons before it answers, spending ~100 tokens doing so.
# Too low a ceiling and the reply is truncated mid-thought and comes back empty.
MAX_TOKENS = 600


async def generate_hotel_summary(hotel: HotelSummaryRequest) -> HotelSummaryData:
    """Write a short summary of one hotel.

    Returns an empty summary rather than raising when the model produces nothing —
    `backend/` treats that as a failure and simply does not cache it.
    """
    llm = get_fast_llm().bind(max_tokens=MAX_TOKENS)

    messages = [
        SystemMessage(content=HOTEL_SUMMARY_SYSTEM),
        HumanMessage(
            content=HOTEL_SUMMARY_USER.format(
                name=hotel.name,
                city=hotel.city,
                country=hotel.country,
                star_rating=hotel.star_rating,
                description=hotel.description,
                amenities=", ".join(hotel.amenities) or "none listed",
                average_rating=hotel.average_rating,
                review_count=hotel.review_count,
            )
        ),
    ]

    response = await llm.ainvoke(messages)
    summary = str(response.content).strip()

    if not summary:
        logger.warning("[chains/summary] model returned no content for %s", hotel.name)

    return HotelSummaryData(summary=summary, model=settings.openrouter_model_fast)
