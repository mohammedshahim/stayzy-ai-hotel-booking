"""Phrasing shared by the tools that describe a hotel to the model."""


def rating_phrase(average: object, count: object) -> str:
    """Report a rating without a denominator — the stored scale is not settled."""
    if not count:
        return "no guest reviews yet"
    return f"guest rating {average} from {count} reviews"


def count_phrase(count: object, singular: str, plural: str) -> str:
    return f"{count} {singular}" if count == 1 else f"{count} {plural}"


def amenity_line(hotel: dict[str, object]) -> str | None:
    amenities = hotel.get("amenities")
    if isinstance(amenities, list) and amenities:
        return f"amenities: {', '.join(str(amenity) for amenity in amenities)}"
    return None
