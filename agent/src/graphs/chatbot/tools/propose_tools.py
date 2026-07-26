"""The chatbot's one chip: a link to a hotel's page.

Only this one. The widget's other two chips — a filtered search and a compare slot —
read to the model as "collect this hotel" and crowd out AddFavorite, which it then
reports it does not have. The chatbot compares by reading CompareHotels instead.
"""

from typing import Any

from pydantic import BaseModel, Field


class ProposeHotel(BaseModel):
    """Offer a chip that opens one hotel's own page on Stayzy.

    This is the only way to take a user to a hotel, so use it whenever they ask to see,
    open, view, or be taken to one — never tell them to look the hotel up elsewhere.
    """

    label: str = Field(description="Short chip text, e.g. 'View Hotel Marais Charme'.")
    hotel_name: str = Field(description="The hotel's exact name.")


# A chip returns nothing the model has to think about, so a turn that already answered
# and only offered chips is finished. See `after_tools` in nodes.py.
CHIP_TOOL_NAMES = frozenset({"ProposeHotel"})


def hotel_chip(label: str, hotel_id: str, hotel_name: str) -> dict[str, Any]:
    """The chip the UI renders. The id rides here because the model must never write it."""
    return {"kind": "open_hotel", "label": label, "hotelId": hotel_id, "hotelName": hotel_name}


def chip_key(chip: dict[str, Any]) -> tuple[str, str]:
    """Two chips are the same offer when they point at the same hotel."""
    return chip["kind"], chip.get("hotelId") or chip["label"]
