"""Chatbot route. Streams one turn as SSE, and pauses it for a confirmation.

A pause ends the turn: the envelope goes out as a `confirm` frame and the decision
arrives as its own request. No stream is ever held open waiting for a person.
"""

import logging
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessageChunk, HumanMessage
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import Command
from pydantic import ValidationError

from src.api.chat_replies import save_reply
from src.api.deps import ActingUser
from src.graphs.chatbot.graph import build_chatbot_graph
from src.graphs.chatbot.nodes import is_final_chip_reply
from src.schemas.chat import ChatbotRequest, PendingConfirmation, PendingData
from src.schemas.common import SuccessResponse
from src.streaming import events

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

SUMMARY_LENGTH = 120

# Backstop only: MAX_TOOL_LOOPS ends a turn first, and the library default is 10007.
RECURSION_LIMIT = 20


def _config(session_id: str, user_id: str | None) -> dict[str, Any]:
    return {
        "configurable": {"thread_id": session_id, "user_id": user_id},
        "recursion_limit": RECURSION_LIMIT,
    }


async def _pending(graph: CompiledStateGraph, config: dict[str, Any]) -> PendingConfirmation | None:
    """The confirmation this thread is waiting on, read straight from the checkpoint."""
    snapshot = await graph.aget_state(config)

    for interrupt in snapshot.interrupts:
        try:
            return PendingConfirmation.model_validate(interrupt.value)
        except ValidationError:
            logger.warning("[api/chatbot] unreadable interrupt on thread %s", config)
    return None


async def _run_turn(
    graph: CompiledStateGraph, body: ChatbotRequest, user_id: str | None
) -> AsyncIterator[str]:
    config = _config(body.session_id, user_id)
    inputs: Any = (
        Command(resume={"approved": body.decision.approved})
        if body.decision is not None
        else {"messages": [HumanMessage(content=body.message)], "actions": [], "steps": 0}
    )

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
                    if message.tool_calls and message.content and not is_final_chip_reply(message):
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
        logger.exception("[api/chatbot] turn failed for thread %s: %s", body.session_id, exc)
        yield events.error("Something went wrong. Please try again.")

    if not failed:
        awaiting = await _pending(graph, config)
        if awaiting:
            yield events.confirm(awaiting.model_dump(by_alias=True))

        text = "\n\n".join("".join(parts) for parts in replies.values()).strip()
        if not text and not awaiting:
            yield events.error("The assistant had nothing to say. Please try again.")
        await save_reply(body.session_id, user_id, text, actions)

    yield events.done()


@router.post("/assistant")
async def chatbot(body: ChatbotRequest, acting_user: ActingUser) -> StreamingResponse:
    """One chatbot turn. `backend/` pipes this body through untouched."""
    graph = build_chatbot_graph()
    config = _config(body.session_id, acting_user)
    awaiting = await _pending(graph, config)

    if body.message is not None and awaiting:
        raise HTTPException(status_code=409, detail="A confirmation is still waiting")
    if body.decision is not None and not awaiting:
        raise HTTPException(status_code=409, detail="Nothing is waiting to be confirmed")

    return StreamingResponse(
        _run_turn(graph, body, acting_user),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/assistant/pending", response_model=SuccessResponse[PendingData])
async def chatbot_pending(session_id: str, acting_user: ActingUser) -> SuccessResponse[PendingData]:
    """What this thread is waiting to have approved, so a reload can render it again."""
    graph = build_chatbot_graph()
    awaiting = await _pending(graph, _config(session_id, acting_user))
    return SuccessResponse(data=PendingData(pending=awaiting))
