"""Hotel lookups only the chatbot offers, on top of the shared search tools.

The widget never binds these: it proposes a comparison as a chip rather than reading
one, and it never discusses a specific room.
"""

from pydantic import BaseModel, Field

from src.clients import backend_client
from src.tools.describe import amenity_line, count_phrase, rating_phrase
from src.tools.outcome import ToolOutcome


class GetRoomTypes(BaseModel):
    """List the rooms one hotel offers for a stay, with their real nightly price and
    whether any are left. Use this before naming a room or quoting a room price, and
    before proposing a booking — never guess either.

    Give the dates and party size when the user has stated them; otherwise they
    default to tonight for two adults, and the prices come back for that stay.
    """

    hotel_name: str = Field(description="Exact hotel name as it appeared earlier.")
    check_in: str | None = Field(default=None, description="Arrival date, YYYY-MM-DD.")
    check_out: str | None = Field(default=None, description="Departure date, YYYY-MM-DD.")
    adults: int | None = Field(default=None, description="Number of adults.")
    kids: int | None = Field(default=None, description="Number of children.")
    rooms: int | None = Field(default=None, description="Number of rooms needed.")


class CompareHotels(BaseModel):
    """Put two to four hotels side by side — price, rating, cancellation terms, and
    amenities — when the user asks which is better or how they differ.

    Every name must be one that appeared in an earlier tool result or that the user
    is currently viewing.
    """

    hotel_names: list[str] = Field(
        description="Between 2 and 4 exact hotel names, as they appeared earlier."
    )


SEARCH_TOOL_SCHEMAS = [GetRoomTypes, CompareHotels]

COMPARE_MIN_HOTELS = 2
COMPARE_MAX_HOTELS = 4

_STAY_PARAM_NAMES = {
    "check_in": "checkIn",
    "check_out": "checkOut",
    "adults": "adults",
    "kids": "kids",
    "rooms": "rooms",
}


def _describe_room(room: dict[str, object]) -> str:
    parts = [
        f"{room['name']} — USD {room['avgNightlyPrice']} per night",
        f"sleeps {count_phrase(room['maxAdults'], 'adult', 'adults')} "
        f"and {count_phrase(room['maxKids'], 'child', 'children')}",
        f"meal plan: {room['mealPlanName']}",
        "sold out for these dates"
        if room.get("isSoldOut")
        else f"{room['remainingInventory']} left",
    ]
    features = room.get("features")
    if isinstance(features, list) and features:
        names = [str(feature.get("name")) for feature in features if isinstance(feature, dict)]
        if names:
            parts.append(f"features: {', '.join(names)}")
    return "; ".join(parts)


def _describe_compared(hotel: dict[str, object]) -> str:
    parts = [
        f"{hotel['name']} — {hotel['city']}, {hotel['country']}",
        f"{hotel['starRating']}-star",
        rating_phrase(hotel.get("averageRating"), hotel.get("reviewCount")),
    ]
    if hotel.get("fromPrice") is not None:
        parts.append(f"from USD {hotel['fromPrice']} per night")
    parts.append("free cancellation" if hotel.get("freeCancellation") else "no free cancellation")
    if hotel.get("cancellationPolicy"):
        parts.append(f"cancellation policy: {hotel['cancellationPolicy']}")
    amenities = amenity_line(hotel)
    if amenities:
        parts.append(amenities)
    return "; ".join(parts)


async def run_get_room_types(
    hotel_id: str, args: dict[str, object], user_id: str | None
) -> ToolOutcome:
    """List one hotel's rooms for a stay, keeping their ids out of the model's reach."""
    params = {
        param: str(args[field]) for field, param in _STAY_PARAM_NAMES.items() if args.get(field)
    }
    rooms = await backend_client.get(
        f"/hotels/{hotel_id}/room-types", user_id=user_id, params=params
    )

    if not rooms:
        return ToolOutcome("No room at that hotel fits this party size.")

    return ToolOutcome(
        "\n".join(_describe_room(room) for room in rooms),
        room_type_ids={room["name"]: room["id"] for room in rooms},
    )


async def run_compare_hotels(hotel_ids: list[str], user_id: str | None) -> ToolOutcome:
    """Compare hotels the graph has already resolved to ids."""
    hotels = await backend_client.get(
        "/hotels/compare", user_id=user_id, params={"ids": ",".join(hotel_ids)}
    )

    if not hotels:
        return ToolOutcome("None of those hotels could be loaded to compare.")

    return ToolOutcome(
        "\n".join(_describe_compared(hotel) for hotel in hotels),
        {hotel["name"]: hotel["id"] for hotel in hotels},
    )
