"""Turning a hotel name the model used back into the id it must never see."""


def resolve_hotel(name: str, hotel_ids: dict[str, str]) -> str | None:
    """Match a name against the ids a graph has collected, ignoring case and padding."""
    exact = hotel_ids.get(name)
    if exact:
        return exact

    lowered = name.strip().lower()
    for known, hotel_id in hotel_ids.items():
        if known.lower() == lowered:
            return hotel_id
    return None
