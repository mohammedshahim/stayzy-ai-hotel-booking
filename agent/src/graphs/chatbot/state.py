"""Conversation state for the chatbot graph."""

from langgraph.graph import MessagesState


class ChatbotState(MessagesState):
    """Messages, the ids tools have seen, and what the UI must render itself.

    `hotel_ids` is how an id reaches a tool without entering the model's tokens.
    """

    hotel_ids: dict[str, str]
    actions: list[dict]
    steps: int
