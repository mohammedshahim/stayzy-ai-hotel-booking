"""Request models for the chat routes."""

from pydantic import BaseModel, Field, model_validator


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


class ConfirmDecision(BaseModel):
    """The user's answer to a pending confirmation."""

    approved: bool


class ConfirmLine(BaseModel):
    """One labelled detail of the action awaiting approval."""

    label: str
    value: str


class PendingConfirmation(BaseModel):
    """The envelope a paused tool built, on its way out to the user's screen."""

    action: str
    title: str
    lines: list[ConfirmLine]
    confirm_label: str = Field(serialization_alias="confirmLabel")

    model_config = {"populate_by_name": True}


class PendingData(BaseModel):
    """What, if anything, a thread is waiting to have approved."""

    pending: PendingConfirmation | None


class ChatbotRequest(BaseModel):
    """One chatbot turn: either something the user said, or their answer to a pause."""

    session_id: str = Field(alias="sessionId")
    message: str | None = None
    decision: ConfirmDecision | None = None

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def exactly_one_input(self) -> "ChatbotRequest":
        if (self.message is None) == (self.decision is None):
            raise ValueError("Send either a message or a decision, not both")
        if self.message is not None and not self.message.strip():
            raise ValueError("A message cannot be blank")
        return self
