"""Chat widget route. Streams one turn as Server-Sent Events."""

import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessageChunk, HumanMessage

from src.api.chat_replies import save_reply
from src.api.deps import ActingUser
from src.graphs.chat_widget.graph import build_widget_graph
from src.schemas.chat import ChatWidgetRequest
from src.streaming import events

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

SUMMARY_LENGTH = 120

# Backstop only: MAX_TOOL_LOOPS ends a turn first, and the library default is 10007.
RECURSION_LIMIT = 12


async def _run_turn(body: ChatWidgetRequest, user_id: str | None) -> AsyncIterator[str]:
    graph = build_widget_graph()
    config = {
        "configurable": {"thread_id": body.session_id, "user_id": user_id},
        "recursion_limit": RECURSION_LIMIT,
    }
    inputs = {
        "messages": [HumanMessage(content=body.message)],
        "context": body.context.model_dump() if body.context else None,
    }

    replies: dict[str, list[str]] = {}
    actions: list[dict] = []
    sent_actions = 0
    failed = False

    try:
        async for mode, payload in graph.astream(
            inputs, config, stream_mode=["messages", "updates"]
        ):
            if mode == "messages":
                chunk, _ = payload
                # Tool results travel this channel too, and are not assistant text.
                if isinstance(chunk, AIMessageChunk) and isinstance(chunk.content, str):
                    if chunk.content:
                        replies.setdefault(str(chunk.id), []).append(chunk.content)
                        yield events.token(chunk.content, str(chunk.id))
                continue

            for node, update in payload.items():
                if node == "agent":
                    message = update["messages"][-1]
                    if message.tool_calls and message.content:
                        replies.pop(str(message.id), None)
                        yield events.drop(str(message.id))
                    for call in message.tool_calls:
                        yield events.tool_start(call["name"])
                elif node == "tools":
                    for message in update["messages"]:
                        yield events.tool_end(message.name, message.content[:SUMMARY_LENGTH])
                    actions = update.get("actions") or []
                    for action in actions[sent_actions:]:
                        yield events.action(action)
                    sent_actions = len(actions)
    except Exception as exc:
        failed = True
        logger.exception("[api/chat_widget] turn failed for thread %s: %s", body.session_id, exc)
        yield events.error("Something went wrong. Please try again.")

    if not failed:
        text = "\n\n".join("".join(parts) for parts in replies.values()).strip()
        await save_reply(body.session_id, user_id, text, actions)

    yield events.done()


@router.post("/widget")
async def chat_widget(body: ChatWidgetRequest, acting_user: ActingUser) -> StreamingResponse:
    """One widget turn. `backend/` pipes this body through untouched."""
    return StreamingResponse(
        _run_turn(body, acting_user),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
