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


class HotelSummaryData(BaseModel):
    """`model` goes back so `backend/` can record which model wrote the row."""

    summary: str
    model: str
