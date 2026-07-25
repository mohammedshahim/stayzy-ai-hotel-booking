"""The signed-in user's own bookings and saved hotels. Chatbot only.

The widget never binds these — it must not read or act on the user's own data.
"""

from pydantic import BaseModel

from src.clients import backend_client
from src.tools.describe import count_phrase, rating_phrase
from src.tools.outcome import ToolOutcome


class ListMyBookings(BaseModel):
    """List the signed-in user's own bookings — upcoming, past, and cancelled — with
    their dates, room, total, and status. Use this for any question about what the
    user has booked, and before discussing one of their stays. Takes no arguments.
    """


class ListMyFavorites(BaseModel):
    """List the hotels the signed-in user has saved to their favorites. Takes no
    arguments.
    """


ACCOUNT_TOOL_SCHEMAS = [ListMyBookings, ListMyFavorites]


def booking_key(booking: dict[str, object]) -> str:
    """How the model refers to one booking — a user can hold several at one hotel."""
    return f"{booking['hotelName']} checking in {booking['checkIn']}"


def unique_booking_key(booking: dict[str, object], taken: dict[str, str]) -> str:
    """Same hotel, same date, two bookings is real — the key still has to be one-to-one."""
    key = booking_key(booking)
    if key not in taken:
        return key

    ordinal = 2
    while f"{key} (booking {ordinal})" in taken:
        ordinal += 1
    return f"{key} (booking {ordinal})"


def _describe_booking(booking: dict[str, object], key: str) -> str:
    parts = [
        key,
        f"{booking['hotelCity']}, {booking['hotelCountry']}",
        str(booking["roomTypeName"]),
        f"{booking['checkIn']} to {booking['checkOut']}",
        f"{count_phrase(booking['roomsBooked'], 'room', 'rooms')} for "
        f"{count_phrase(booking['adults'], 'adult', 'adults')} "
        f"and {count_phrase(booking['kids'], 'child', 'children')}",
        f"USD {booking['totalPrice']} total",
        f"status: {str(booking['status']).replace('_', ' ')}",
    ]
    if booking.get("isCancellable"):
        parts.append("still cancellable")

    review = booking.get("review")
    if isinstance(review, dict):
        parts.append(f"already reviewed {review['rating']} out of 5")
    else:
        parts.append("not reviewed yet")

    return "; ".join(parts)


def _describe_favorite(favorite: dict[str, object]) -> str:
    parts = [
        f"{favorite['name']} — {favorite['city']}, {favorite['country']}",
        f"{favorite['starRating']}-star",
        rating_phrase(favorite.get("averageRating"), favorite.get("reviewCount")),
    ]
    if favorite.get("fromPrice") is not None:
        parts.append(f"from USD {favorite['fromPrice']} per night")
    parts.append(f"saved {str(favorite['savedAt'])[:10]}")
    return "; ".join(parts)


async def run_list_my_bookings(user_id: str | None) -> ToolOutcome:
    """List the acting user's bookings, keying each one the way the model must name it."""
    bookings = await backend_client.get("/internal/bookings", user_id=user_id)

    if not bookings:
        return ToolOutcome("You have no bookings on Stayzy yet.")

    booking_ids: dict[str, str] = {}
    lines: list[str] = []
    for booking in bookings:
        key = unique_booking_key(booking, booking_ids)
        booking_ids[key] = booking["id"]
        lines.append(_describe_booking(booking, key))

    return ToolOutcome(
        "\n".join(lines),
        hotel_ids={booking["hotelName"]: booking["hotelId"] for booking in bookings},
        booking_ids=booking_ids,
    )


async def run_list_my_favorites(user_id: str | None) -> ToolOutcome:
    """List the acting user's saved hotels without exposing any id."""
    favorites = await backend_client.get("/internal/favorites", user_id=user_id)

    if not favorites:
        return ToolOutcome("You have not saved any hotels to your favorites yet.")

    return ToolOutcome(
        "\n".join(_describe_favorite(favorite) for favorite in favorites),
        {favorite["name"]: favorite["id"] for favorite in favorites},
    )
