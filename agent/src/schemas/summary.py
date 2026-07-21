"""Request and response models for the summary routes."""

from pydantic import BaseModel, Field


class HotelSummaryRequest(BaseModel):
    """The hotel facts `backend/` hashes and sends. Nothing else reaches the model."""

    name: str
    description: str
    city: str
    country: str
    star_rating: int = Field(alias="starRating")
    amenities: list[str]
    average_rating: float = Field(alias="averageRating")
    review_count: int = Field(alias="reviewCount")

    model_config = {"populate_by_name": True}


class CompareHotel(BaseModel):
    """One hotel in a comparison. No price — see `backend/`'s toComparePayload for why."""

    name: str
    city: str
    country: str
    star_rating: int = Field(alias="starRating")
    amenities: list[str]
    average_rating: float = Field(alias="averageRating")
    review_count: int = Field(alias="reviewCount")
    cancellation_policy: str = Field(alias="cancellationPolicy")
    free_cancellation: bool = Field(alias="freeCancellation")

    model_config = {"populate_by_name": True}


class CompareSummaryRequest(BaseModel):
    """Two to four hotels, already validated and ordered by `backend/`."""

    hotels: list[CompareHotel] = Field(min_length=2, max_length=4)


class HotelSummaryData(BaseModel):
    """`model` goes back so `backend/` can record which model wrote the row."""

    summary: str
    model: str
