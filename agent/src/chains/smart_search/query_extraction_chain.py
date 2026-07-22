"""Single-shot extraction of search filters from one sentence. No graph, no state."""

import json
import logging
import re

from langchain_core.messages import HumanMessage, SystemMessage

from src.chains.smart_search.prompts import QUERY_EXTRACTION_SYSTEM
from src.config.llm import get_fast_llm
from src.schemas.smart_search import QueryExtractionData, QueryExtractionRequest

logger = logging.getLogger(__name__)

# Too small a ceiling returns empty content, not short content — see hotel_summary_chain.
MAX_TOKENS = 1200

# Reasoning models wrap the object in a fence or a sentence.
_JSON_OBJECT = re.compile(r"\{.*\}", re.DOTALL)


def _parse(reply: str) -> QueryExtractionData | None:
    match = _JSON_OBJECT.search(reply)
    if not match:
        return None
    try:
        return QueryExtractionData.model_validate(json.loads(match.group()))
    except (json.JSONDecodeError, ValueError):
        return None


async def extract_query(request: QueryExtractionRequest) -> QueryExtractionData | None:
    """Returns None when the model writes something that is not a filter object."""
    llm = get_fast_llm(temperature=0).bind(max_tokens=MAX_TOKENS)

    system = QUERY_EXTRACTION_SYSTEM.format(
        today=request.today,
        amenities=", ".join(request.amenities),
        room_features=", ".join(request.room_features),
        meal_plans=", ".join(request.meal_plans),
        sort_options=", ".join(request.sort_options),
    )

    response = await llm.ainvoke(
        [SystemMessage(content=system), HumanMessage(content=request.prompt)]
    )
    extracted = _parse(str(response.content))

    if extracted is None:
        logger.warning("[chains/smart_search] no filter object in the reply to %r", request.prompt)

    return extracted
