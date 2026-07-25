"""Persisting an assistant reply, which `backend/` cannot read off the stream itself."""

import logging

from src.clients import backend_client

logger = logging.getLogger(__name__)


async def save_reply(session_id: str, user_id: str | None, text: str, actions: list[dict]) -> None:
    """Write the surviving reply to `backend/`. A turn that produced none writes nothing."""
    if not user_id or not text:
        return

    try:
        await backend_client.post(
            "/internal/chat/messages",
            user_id=user_id,
            json={"sessionId": session_id, "content": text, "actions": actions},
        )
    except backend_client.BackendError:
        logger.exception("[api/chat_replies] could not persist reply for thread %s", session_id)
