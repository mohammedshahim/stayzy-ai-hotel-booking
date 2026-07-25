"""Hotel search tools every chat surface shares.

Each schema's docstring is the interface the model reads. No schema takes an id: the
model works in names, and the calling graph maps one back to an id it has seen.
"""

from pydantic import BaseModel, Field

from src.clients import backend_client
from src.tools.describe import amenity_line, rating_phrase
from src.tools.outcome import ToolOutcome


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

    hotel_name: str = Field(description="Exact hotel name as it appeared earlier.")


SEARCH_TOOL_SCHEMAS = [SearchHotels, GetHotelDetails]

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
    """Fetch one hotel's own page data. The id comes from the graph, never the model."""
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
