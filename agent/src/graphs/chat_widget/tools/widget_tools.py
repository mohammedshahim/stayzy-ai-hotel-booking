"""The widget's tool surface: the read-only tools it may use, plus its chip proposals.

Only what is listed in TOOL_SCHEMAS reaches the widget's model. No booking, cancel,
favorite, or review tool ever belongs here — the widget can propose and navigate, but
it can never move money or write the user's data.
"""

from pydantic import BaseModel, Field

from src.tools.search_tools import SEARCH_PARAM_NAMES, GetHotelDetails, SearchHotels


class ProposeSearch(BaseModel):
    """Offer the user a clickable chip that opens a filtered search page.

    Use this whenever you suggest a different set of hotels — it lets them see the
    results in the full search UI. It only offers; nothing moves until they click.
    Fill in the same filters you would pass to SearchHotels.
    """

    label: str = Field(description="Short chip text, e.g. 'Cheaper hotels near the Louvre'.")
    destination: str | None = None
    near: str | None = None
    check_in: str | None = None
    check_out: str | None = None
    adults: int | None = None
    kids: int | None = None
    rooms: int | None = None
    min_price: float | None = None
    max_price: float | None = None
    star_ratings: list[int] | None = None
    min_guest_rating: float | None = None
    amenities: list[str] | None = None
    free_cancellation_only: bool | None = None


class ProposeHotel(BaseModel):
    """Offer a chip that opens one hotel's own page. Only for a hotel that appeared
    in a tool result or that the user is currently viewing.
    """

    label: str = Field(description="Short chip text, e.g. 'View Hotel Marais Charme'.")
    hotel_name: str = Field(description="Exact hotel name as it appeared earlier.")


class ProposeCompare(BaseModel):
    """Offer a chip that adds a hotel to the user's comparison tray, which holds up
    to four hotels side by side. Only for a hotel that appeared in a tool result.
    """

    label: str = Field(description="Short chip text, e.g. 'Compare Le Louvre Riverside'.")
    hotel_name: str = Field(description="Exact hotel name as it appeared earlier.")


TOOL_SCHEMAS = [
    SearchHotels,
    GetHotelDetails,
    ProposeSearch,
    ProposeHotel,
    ProposeCompare,
]


def to_chip_filters(args: dict[str, object]) -> dict[str, object]:
    """Turn a chip proposal into the `ExtractedSearchFilters` shape `frontend/` merges.

    Amenities stay as names; the frontend maps them to ids from its own catalog.
    """
    filters: dict[str, object] = {}

    for field, key in SEARCH_PARAM_NAMES.items():
        value = args.get(field)
        if value is not None:
            filters[key] = value

    for field, key in (("star_ratings", "starRatings"), ("amenities", "amenities")):
        values = args.get(field)
        if isinstance(values, list) and values:
            filters[key] = values

    if args.get("free_cancellation_only"):
        filters["freeCancellationOnly"] = True
    if args.get("near"):
        filters["sort"] = "distance"

    return filters
