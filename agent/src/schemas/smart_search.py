"""Request and response models for the smart search routes."""

from pydantic import BaseModel, Field


class QueryExtractionRequest(BaseModel):
    """The prompt plus everything the model needs to answer it.

    `today` and the three vocabularies come from `backend/` on every call — this
    service reads no clock and no table of its own.
    """

    prompt: str
    today: str
    amenities: list[str]
    room_features: list[str] = Field(alias="roomFeatures")
    meal_plans: list[str] = Field(alias="mealPlans")
    sort_options: list[str] = Field(alias="sortOptions")

    model_config = {"populate_by_name": True}


class ExtractedFilters(BaseModel):
    """A partial search query. An unset field means the prompt never mentioned it."""

    destination: str | None = None
    near: str | None = None
    check_in: str | None = Field(default=None, alias="checkIn")
    check_out: str | None = Field(default=None, alias="checkOut")
    adults: int | None = None
    kids: int | None = None
    rooms: int | None = None
    min_price: float | None = Field(default=None, alias="minPrice")
    max_price: float | None = Field(default=None, alias="maxPrice")
    star_ratings: list[int] | None = Field(default=None, alias="starRatings")
    min_guest_rating: float | None = Field(default=None, alias="minGuestRating")
    amenities: list[str] | None = None
    room_features: list[str] | None = Field(default=None, alias="roomFeatures")
    meal_plans: list[str] | None = Field(default=None, alias="mealPlans")
    free_cancellation_only: bool | None = Field(default=None, alias="freeCancellationOnly")
    sort: str | None = None

    model_config = {"populate_by_name": True}


class QueryExtractionData(BaseModel):
    """`unmapped` carries the phrases that became no filter, for the UI to show."""

    filters: ExtractedFilters
    unmapped: list[str] = []
