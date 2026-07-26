"""The chatbot's hotel lookups: search, one hotel's details, its rooms, and compare.

Each schema's docstring is the interface the model reads. No schema takes an id: the
model works in names, and the node maps a name back to an id.
"""

from pydantic import BaseModel, Field

from src.clients import backend_client
from src.graphs.describe import amenity_line, count_phrase, rating_phrase
from src.graphs.outcome import ToolOutcome


class SearchHotels(BaseModel):
    """Search Stayzy's real hotel inventory. Use this for any question about which
    hotels exist, what they cost, or what is available. Never answer from memory —
    prices and availability change, and only this tool knows them.

    Leave a field out when the user did not mention it. To search around a place or
    another hotel, put that place in `near` rather than in `destination`.
    """

    destination: str | None = Field(
        default=None, description="City or area to search in, e.g. 'Paris'."
    )
    near: str | None = Field(
        default=None,
        description="Anchor the search around this hotel name, city, or district. "
        "Results come back ordered by distance from it.",
    )
    check_in: str | None = Field(default=None, description="Arrival date, YYYY-MM-DD.")
    check_out: str | None = Field(default=None, description="Departure date, YYYY-MM-DD.")
    adults: int | None = Field(default=None, description="Number of adults.")
    kids: int | None = Field(default=None, description="Number of children.")
    rooms: int | None = Field(default=None, description="Number of rooms needed.")
    min_price: float | None = Field(default=None, description="Lowest nightly price to include.")
    max_price: float | None = Field(default=None, description="Highest nightly price to include.")
    star_ratings: list[int] | None = Field(
        default=None, description="Only these star ratings, each 1 to 5."
    )
    min_guest_rating: float | None = Field(
        default=None, description="Lowest guest rating out of 10 to include."
    )
    amenities: list[str] | None = Field(
        default=None,
        description="Amenity names the hotel must have, e.g. ['Gym', 'Spa']. "
        "Use the exact names Stayzy uses; an unknown name is reported back to you.",
    )
    free_cancellation_only: bool | None = Field(
        default=None, description="Only hotels offering free cancellation."
    )


class GetHotelDetails(BaseModel):
    """Get the full description, policies, and amenities for one hotel the user is
    looking at or that a previous search returned. Give the hotel's exact name.
    """

    hotel_name: str = Field(description="The hotel's exact name.")


class GetRoomTypes(BaseModel):
    """List the rooms one hotel offers for a stay, with their real nightly price and
    whether any are left. Use this before naming a room or quoting a room price, and
    before proposing a booking — never guess either.

    Give the dates and party size when the user has stated them; otherwise they
    default to tonight for two adults, and the prices come back for that stay.
    """

    hotel_name: str = Field(description="The hotel's exact name.")
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

    hotel_names: list[str] = Field(description="Between 2 and 4 exact hotel names.")


SEARCH_TOOL_SCHEMAS = [SearchHotels, GetHotelDetails, GetRoomTypes, CompareHotels]

SEARCH_PARAM_NAMES = {
    "destination": "destination",
    "near": "near",
    "check_in": "checkIn",
    "check_out": "checkOut",
    "adults": "adults",
    "kids": "kids",
    "rooms": "rooms",
    "min_price": "minPrice",
    "max_price": "maxPrice",
    "min_guest_rating": "minGuestRating",
}


def to_search_params(args: dict[str, object]) -> dict[str, str]:
    """Turn tool arguments into `/internal/search` query params, filters as names."""
    params: dict[str, str] = {}

    for field, param in SEARCH_PARAM_NAMES.items():
        value = args.get(field)
        if value is not None:
            params[param] = str(value)

    for field, param in (("star_ratings", "starRatings"), ("amenities", "amenities")):
        values = args.get(field)
        if isinstance(values, list) and values:
            params[param] = ",".join(str(item) for item in values)

    if args.get("free_cancellation_only"):
        params["freeCancellationOnly"] = "true"
    if args.get("near"):
        params["sort"] = "distance"

    return params


def _describe(hotel: dict[str, object]) -> str:
    parts = [
        f"{hotel['name']} — {hotel['city']}, {hotel['country']}",
        f"{hotel['starRating']}-star",
        rating_phrase(hotel.get("guestRating"), hotel.get("reviewCount")),
        f"USD {hotel['pricePerNight']} per night in a {hotel['roomType']}",
        f"meal plan: {hotel['mealPlan']}",
    ]
    if hotel.get("distanceKm") is not None:
        parts.append(f"{hotel['distanceKm']} km away")
    if hotel.get("freeCancellation"):
        parts.append("free cancellation")
    amenities = amenity_line(hotel)
    if amenities:
        parts.append(amenities)
    return "; ".join(parts)


async def run_search_hotels(args: dict[str, object], user_id: str | None) -> ToolOutcome:
    """Search real inventory and describe the results without exposing any id."""
    data = await backend_client.get(
        "/internal/search", user_id=user_id, params=to_search_params(args)
    )

    items = data.get("items", [])
    if not items:
        return ToolOutcome("No hotels matched those filters.")

    lines = [_describe(hotel) for hotel in items]
    anchor = data.get("anchor")
    if anchor:
        lines.insert(0, f"Distances are measured from {anchor['label']}.")
    elif args.get("near"):
        lines.insert(0, f"Could not place '{args['near']}', so results are not distance-ordered.")

    unresolved = data.get("unresolvedFilters") or []
    if unresolved:
        lines.append(f"Stayzy has no filter named: {', '.join(unresolved)}. It was ignored.")

    return ToolOutcome("\n".join(lines), {hotel["name"]: hotel["id"] for hotel in items})


async def run_get_hotel_details(hotel_id: str, user_id: str | None) -> ToolOutcome:
    """Fetch one hotel's own page data. The id comes from the node, never the model."""
    hotel = await backend_client.get(f"/hotels/{hotel_id}", user_id=user_id)

    amenities = [amenity["name"] for amenity in hotel.get("amenities", [])]
    lines = [
        f"{hotel['name']} — {hotel['city']}, {hotel['country']}",
        f"{hotel['starRating']}-star, "
        f"{rating_phrase(hotel.get('averageRating'), hotel.get('reviewCount'))}",
        f"Address: {hotel['addressLine1']}",
        f"Check-in {hotel['checkInTime']}, check-out {hotel['checkOutTime']}",
        f"Description: {hotel['description']}",
    ]
    if amenities:
        lines.append(f"Amenities: {', '.join(amenities)}")
    if hotel.get("cancellationPolicy"):
        lines.append(f"Cancellation policy: {hotel['cancellationPolicy']}")

    return ToolOutcome("\n".join(lines), {hotel["name"]: hotel["id"]})


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
