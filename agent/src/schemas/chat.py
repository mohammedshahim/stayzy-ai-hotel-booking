"""Request models for the chat widget route."""

from pydantic import BaseModel, Field


class PageContext(BaseModel):
    """What the user is looking at, sent fresh by `backend/` on every turn."""

    path: str
    hotel_id: str | None = Field(default=None, alias="hotelId")
    hotel_name: str | None = Field(default=None, alias="hotelName")
    summary: str | None = None

    model_config = {"populate_by_name": True}


class ChatWidgetRequest(BaseModel):
    """One user turn. `session_id` becomes the checkpointer thread id verbatim."""

    session_id: str = Field(alias="sessionId")
    message: str
    context: PageContext | None = None

    model_config = {"populate_by_name": True}
