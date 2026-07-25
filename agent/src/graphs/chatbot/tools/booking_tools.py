"""Holding a room and cancelling a stay. Chatbot only, both gated by `interrupt()`.

Neither tool trusts an id the model supplied or a map from an earlier turn: the room
is re-read for the exact dates being booked, and the booking list is re-read to resolve
the name the model used. That keeps the price and availability shown on the confirmation
card the ones that actually apply.
"""

from datetime import date

from pydantic import BaseModel, Field

from src.clients import backend_client
from src.graphs.chatbot.tools.account_tools import find_booking_by_name, unknown_booking
from src.graphs.chatbot.tools.confirm import DECLINED, confirm
from src.tools.describe import count_phrase
from src.tools.outcome import ToolOutcome


class BookRoom(BaseModel):
    """Hold a room for the user. Call `GetRoomTypes` first — never guess a room name,
    a price, or whether anything is left.

    This holds the room and hands back a payment link; it never takes payment, and the
    booking is not confirmed until the user pays. The user is asked to confirm the exact
    details before anything is held, so propose the booking as soon as you have all of
    them rather than asking for a separate yes first.
    """

    hotel_name: str = Field(description="Exact hotel name as it appeared earlier.")
    room_type_name: str = Field(description="Exact room name as `GetRoomTypes` returned it.")
    check_in: str = Field(description="Arrival date, YYYY-MM-DD.")
    check_out: str = Field(description="Departure date, YYYY-MM-DD.")
    adults: int = Field(description="Number of adults.")
    kids: int = Field(default=0, description="Number of children.")
    rooms: int = Field(default=1, description="Number of rooms to hold.")


class CancelBooking(BaseModel):
    """Cancel one of the user's own bookings. Only a confirmed booking with free
    cancellation can be cancelled.

    Name the booking exactly as `ListMyBookings` reported it. The user is asked to
    confirm before anything is cancelled.
    """

    booking: str = Field(description="The booking, named exactly as `ListMyBookings` reported it.")


BOOKING_TOOL_SCHEMAS = [BookRoom, CancelBooking]


def _nights(check_in: str, check_out: str) -> int:
    return (date.fromisoformat(check_out) - date.fromisoformat(check_in)).days


def _match_by_name(name: str, candidates: list[dict], field: str) -> dict | None:
    wanted = name.strip().lower()
    for candidate in candidates:
        if str(candidate.get(field, "")).strip().lower() == wanted:
            return candidate
    return None


def _party_phrase(adults: object, kids: object, rooms: object) -> str:
    party = count_phrase(adults, "adult", "adults")
    if kids:
        party += f" and {count_phrase(kids, 'child', 'children')}"
    return f"{party}, {count_phrase(rooms, 'room', 'rooms')}"


async def run_book_room(hotel_id: str, args: dict[str, object], user_id: str | None) -> ToolOutcome:
    """Re-price the room, confirm with the user, then hold it pending payment."""
    hotel_name = str(args["hotel_name"])
    room_name = str(args["room_type_name"])
    check_in, check_out = str(args["check_in"]), str(args["check_out"])
    adults, kids, rooms = args["adults"], args.get("kids") or 0, args.get("rooms") or 1

    try:
        nights = _nights(check_in, check_out)
    except ValueError:
        return ToolOutcome("Those dates are not valid calendar dates. Ask the user again.")
    if nights < 1:
        return ToolOutcome("The check-out date must be after the check-in date.")

    available = await backend_client.get(
        f"/hotels/{hotel_id}/room-types",
        user_id=user_id,
        params={
            "checkIn": check_in,
            "checkOut": check_out,
            "adults": str(adults),
            "kids": str(kids),
            "rooms": str(rooms),
        },
    )

    room = _match_by_name(room_name, available or [], "name")
    if not room:
        offered = ", ".join(str(candidate["name"]) for candidate in available or [])
        return ToolOutcome(
            f"{hotel_name} has no room called '{room_name}' for these dates and this party. "
            + (f"It offers: {offered}." if offered else "It has nothing that fits.")
        )
    if room.get("isSoldOut"):
        return ToolOutcome(f"The {room['name']} is sold out for {check_in} to {check_out}.")

    remaining = room.get("remainingInventory") or 0
    if remaining < int(rooms):
        return ToolOutcome(
            f"Only {count_phrase(remaining, 'room', 'rooms')} of the {room['name']} "
            f"remain for those dates, and the user asked for {rooms}."
        )

    nightly = float(room["avgNightlyPrice"])
    total = round(nightly * nights * int(rooms))

    approved = confirm(
        "book_room",
        "Confirm this booking",
        [
            ("Hotel", hotel_name),
            ("Room", str(room["name"])),
            ("Dates", f"{check_in} to {check_out} ({count_phrase(nights, 'night', 'nights')})"),
            ("Guests", _party_phrase(adults, kids, rooms)),
            ("Total", f"USD {total}"),
        ],
        "Confirm booking",
    )
    if not approved:
        return DECLINED

    booking = await backend_client.post(
        "/internal/bookings",
        user_id=user_id,
        json={
            "hotelId": hotel_id,
            "roomTypeId": room["id"],
            "checkIn": check_in,
            "checkOut": check_out,
            "adults": adults,
            "kids": kids,
            "rooms": rooms,
        },
    )

    return ToolOutcome(
        f"The {room['name']} at {hotel_name} is held for {check_in} to {check_out}, "
        f"USD {booking['totalPrice']} total. It is not confirmed yet — the payment link "
        "is already on the user's screen, and the hold is released if they do not pay. "
        "Tell them to use that link; never ask for card details.",
        action={
            "kind": "checkout",
            "label": "Complete payment",
            "path": f"/checkout/{booking['id']}",
        },
    )


async def run_cancel_booking(args: dict[str, object], user_id: str | None) -> ToolOutcome:
    """Check the booking can actually be cancelled, confirm, then cancel it."""
    name = str(args["booking"])

    found = await find_booking_by_name(name, user_id)
    if not found:
        return unknown_booking(name)
    key, booking = found

    status = str(booking["status"]).replace("_", " ")
    if not booking.get("isCancellable"):
        if booking["status"] != "confirmed":
            return ToolOutcome(
                f"That booking is {status}, and only a confirmed booking can be cancelled."
            )
        return ToolOutcome(
            "That booking is non-refundable, so it cannot be cancelled online. The user "
            "would need to contact the hotel."
        )

    approved = confirm(
        "cancel_booking",
        "Cancel this booking?",
        [
            ("Hotel", str(booking["hotelName"])),
            ("Room", str(booking["roomTypeName"])),
            ("Dates", f"{booking['checkIn']} to {booking['checkOut']}"),
            ("Refund", f"USD {booking['totalPrice']}"),
        ],
        "Cancel booking",
    )
    if not approved:
        return DECLINED

    await backend_client.post(f"/internal/bookings/{booking['id']}/cancel", user_id=user_id)

    return ToolOutcome(f"Cancelled — {key} is no longer booked.")
