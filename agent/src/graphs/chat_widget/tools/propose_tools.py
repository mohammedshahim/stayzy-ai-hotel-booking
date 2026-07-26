"""The widget's chip proposals: a filtered search, a hotel page, a compare slot.

A chip only ever offers. Nothing moves until the user clicks it, so these tools never
change anything and the widget can hold all three.
"""

from typing import Any

from pydantic import BaseModel, Field

from src.graphs.chat_widget.tools.search_tools import SEARCH_PARAM_NAMES


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
    """Offer a chip that opens one hotel's own page on Stayzy.

    This is the only way to take a user to a hotel, so use it whenever they ask to see,
    open, view, or be taken to one — never tell them to look the hotel up elsewhere.
    """

    label: str = Field(description="Short chip text, e.g. 'View Hotel Marais Charme'.")
    hotel_name: str = Field(description="The hotel's exact name.")


class ProposeCompare(BaseModel):
    """Offer a chip that adds a hotel to the user's comparison tray, which holds up
    to four hotels side by side.
    """

    label: str = Field(description="Short chip text, e.g. 'Compare Le Louvre Riverside'.")
    hotel_name: str = Field(description="The hotel's exact name.")


# A chip returns nothing the model has to think about, so a turn that already answered
# and only offered chips is finished. See `after_tools` in nodes.py.
CHIP_TOOL_NAMES = frozenset({"ProposeSearch", "ProposeHotel", "ProposeCompare"})


def search_chip(args: dict[str, Any]) -> dict[str, Any]:
    """A chip that opens `/search`, carrying filters as names for the frontend to map."""
    filters: dict[str, Any] = {}

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

    return {"kind": "navigate", "label": args["label"], "filters": filters}


def hotel_chip(tool_name: str, label: str, hotel_id: str, hotel_name: str) -> dict[str, Any]:
    """A chip that opens a hotel's page, or adds it to the compare tray."""
    kind = "open_hotel" if tool_name == "ProposeHotel" else "compare"
    return {"kind": kind, "label": label, "hotelId": hotel_id, "hotelName": hotel_name}


def chip_key(chip: dict[str, Any]) -> tuple[str, str]:
    """Two chips are the same offer when the hotel matches, or the label for a search."""
    return chip["kind"], chip.get("hotelId") or chip["label"]
