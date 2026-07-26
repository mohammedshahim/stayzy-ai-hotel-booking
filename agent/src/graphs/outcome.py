"""What every tool run gives back."""

from typing import NamedTuple


class ToolOutcome(NamedTuple):
    """Text for the model, and the ids the model must never see.

    A graph keeps the id maps so a later turn can resolve a name the model repeats
    back. Treat them as read-only — the empty defaults are shared between instances.

    `action` carries what the UI must render but the model must never write itself,
    such as a chip or a checkout link.
    """

    text: str
    hotel_ids: dict[str, str] = {}
    room_type_ids: dict[str, str] = {}
    booking_ids: dict[str, str] = {}
    action: dict[str, object] | None = None
