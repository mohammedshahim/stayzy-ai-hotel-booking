"""Smart search routes."""

from fastapi import APIRouter, HTTPException

from src.api.deps import ActingUser
from src.chains.smart_search.query_extraction_chain import extract_query
from src.schemas.common import SuccessResponse
from src.schemas.smart_search import QueryExtractionData, QueryExtractionRequest

router = APIRouter(prefix="/smart-search", tags=["smart-search"])


@router.post(
    "/extract",
    response_model=SuccessResponse[QueryExtractionData],
    # An unset filter must be absent from the JSON, never null.
    response_model_exclude_none=True,
)
async def extract_search_query(
    body: QueryExtractionRequest,
    _acting_user: ActingUser,
) -> SuccessResponse[QueryExtractionData]:
    """Turn one sentence into search filters. Not user-scoped."""
    data = await extract_query(body)
    if data is None:
        raise HTTPException(status_code=502, detail="Could not extract filters from that prompt")
    return SuccessResponse(data=data)
