"""Reading what guests wrote about a hotel. Chatbot only."""

from pydantic import BaseModel, Field

from src.clients import backend_client
from src.tools.outcome import ToolOutcome


class GetHotelReviews(BaseModel):
    """Read what guests actually wrote about one hotel, in their own words. Use this
    when the user asks what people say about a hotel, or how well reviewed it is —
    GetHotelDetails gives only the score, never the comments.
    """

    hotel_name: str = Field(description="Exact hotel name as it appeared earlier.")


REVIEW_TOOL_SCHEMAS = [GetHotelReviews]

REVIEW_PAGE_SIZE = 5


def _describe_review(review: dict[str, object]) -> str:
    return f"{review['reviewerName']} rated it {review['rating']} out of 5: {review['description']}"


async def run_get_hotel_reviews(hotel_id: str, user_id: str | None) -> ToolOutcome:
    """Fetch one hotel's guest reviews. The id comes from the graph, never the model."""
    result = await backend_client.get(
        f"/hotels/{hotel_id}/reviews",
        user_id=user_id,
        params={"pageSize": str(REVIEW_PAGE_SIZE)},
    )

    reviews = result.get("reviews", {}).get("data", [])
    if not reviews:
        return ToolOutcome("No guest has written a review for this hotel yet.")

    lines = [_describe_review(review) for review in reviews]
    total = result.get("reviewCount")
    if isinstance(total, int) and total > len(reviews):
        lines.insert(0, f"Showing {len(reviews)} of {total} reviews.")

    return ToolOutcome("\n".join(lines))
