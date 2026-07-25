"""Reading what guests wrote about a hotel, and writing the user's own. Chatbot only."""

from pydantic import BaseModel, Field

from src.clients import backend_client
from src.graphs.chatbot.tools.account_tools import find_booking_by_name, unknown_booking
from src.graphs.chatbot.tools.confirm import DECLINED, confirm
from src.tools.outcome import ToolOutcome


class GetHotelReviews(BaseModel):
    """Read what guests actually wrote about one hotel, in their own words. Use this
    when the user asks what people say about a hotel, or how well reviewed it is —
    GetHotelDetails gives only the score, never the comments.
    """

    hotel_name: str = Field(description="Exact hotel name as it appeared earlier.")


class WriteReview(BaseModel):
    """Publish the user's own review of a stay they have completed. Write the review
    yourself from what they told you, in their voice, and choose the rating their words
    imply — they see the draft and approve it before it is published, so do not read it
    back to them first.

    Only a completed booking can be reviewed, and only once.
    """

    booking: str = Field(description="The stay, named exactly as `ListMyBookings` reported it.")
    rating: int = Field(description="Whole number of stars, 1 to 5, implied by what they said.")
    description: str = Field(description="The review itself, in the user's voice.")


REVIEW_TOOL_SCHEMAS = [GetHotelReviews, WriteReview]

REVIEW_PAGE_SIZE = 5

RATING_MIN = 1
RATING_MAX = 5


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


async def run_write_review(args: dict[str, object], user_id: str | None) -> ToolOutcome:
    """Check the stay is reviewable, show the draft for approval, then publish it."""
    name = str(args["booking"])
    description = str(args["description"]).strip()

    try:
        rating = int(args["rating"])
    except (TypeError, ValueError):
        return ToolOutcome(f"'{args['rating']}' is not a rating. Use a whole number of stars.")
    if not RATING_MIN <= rating <= RATING_MAX:
        return ToolOutcome(f"A rating must be {RATING_MIN} to {RATING_MAX} stars.")
    if not description:
        return ToolOutcome("A review needs something written in it. Draft it from what they said.")

    found = await find_booking_by_name(name, user_id)
    if not found:
        return unknown_booking(name)
    _, booking = found

    if booking["status"] != "completed":
        status = str(booking["status"]).replace("_", " ")
        return ToolOutcome(
            f"That stay is {status}. Only a completed stay can be reviewed, so the user "
            "has to check out first."
        )
    if booking.get("review"):
        return ToolOutcome(
            "The user has already reviewed that stay, and it cannot be reviewed twice."
        )

    approved = confirm(
        "write_review",
        "Publish this review?",
        [
            ("Hotel", str(booking["hotelName"])),
            ("Stay", f"{booking['checkIn']} to {booking['checkOut']}"),
            ("Rating", f"{rating} out of {RATING_MAX}"),
            ("Review", description),
        ],
        "Publish review",
    )
    if not approved:
        return DECLINED

    await backend_client.post(
        f"/internal/bookings/{booking['id']}/review",
        user_id=user_id,
        json={"rating": rating, "description": description},
    )

    return ToolOutcome(
        f"Published — the user's {rating}-star review of {booking['hotelName']} is now live."
    )
