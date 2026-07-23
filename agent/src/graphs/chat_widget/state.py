"""Conversation state for the widget graph."""

from langgraph.graph import MessagesState


class WidgetState(MessagesState):
    """Messages plus the current page, the ids tools saw, and the chips offered.

    `hotel_ids` is how an id reaches a chip without entering the model's tokens.
    """

    context: dict | None
    viewed: list[str]
    hotel_ids: dict[str, str]
    actions: list[dict]
    steps: int
