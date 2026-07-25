"""The chatbot graph's nodes: the model turn and gated tool dispatch."""

import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig

from src.clients.backend_client import BackendError
from src.config.llm import get_smart_llm
from src.graphs.chatbot.prompts import CHATBOT_SYSTEM
from src.graphs.chatbot.state import ChatbotState
from src.graphs.chatbot.tools import search_tools as chatbot_search
from src.graphs.chatbot.tools.account_tools import (
    ACCOUNT_TOOL_SCHEMAS,
    run_add_favorite,
    run_list_my_bookings,
    run_list_my_favorites,
)
from src.graphs.chatbot.tools.booking_tools import (
    BOOKING_TOOL_SCHEMAS,
    run_book_room,
    run_cancel_booking,
)
from src.graphs.chatbot.tools.review_tools import (
    REVIEW_TOOL_SCHEMAS,
    run_get_hotel_reviews,
    run_write_review,
)
from src.tools import search_tools as shared_search
from src.tools.outcome import ToolOutcome
from src.tools.resolve import resolve_hotel

logger = logging.getLogger(__name__)

# Too low a ceiling returns empty content, not short content — see hotel_summary_chain.
MAX_TOKENS = 2000

LLM_ATTEMPTS = 3

# Past this the tools are left unbound so the model must reply in words.
MAX_TOOL_LOOPS = 8

TOOL_SCHEMAS = [
    *shared_search.SEARCH_TOOL_SCHEMAS,
    *chatbot_search.SEARCH_TOOL_SCHEMAS,
    *REVIEW_TOOL_SCHEMAS,
    *ACCOUNT_TOOL_SCHEMAS,
    *BOOKING_TOOL_SCHEMAS,
]

MUTATING_TOOLS = frozenset({"BookRoom", "CancelBooking", "WriteReview", "AddFavorite"})

HOTEL_NAME_TOOLS = frozenset(
    {"GetHotelDetails", "GetRoomTypes", "GetHotelReviews", "AddFavorite", "BookRoom"}
)

SECOND_MUTATION = ToolOutcome(
    "Not run. Only one action that changes something can happen at a time. Ask for this "
    "one again after the user has answered the confirmation already on their screen."
)

LOOKUP_FAILED = ToolOutcome("That lookup failed. Tell the user, briefly.")


async def call_model(state: ChatbotState) -> dict[str, Any]:
    """One model turn, with the tools dropped once the loop has gone on long enough."""
    steps = state.get("steps", 0)

    llm = get_smart_llm().bind(max_tokens=MAX_TOKENS)
    if steps < MAX_TOOL_LOOPS:
        llm = llm.bind_tools(TOOL_SCHEMAS)

    messages = [SystemMessage(content=CHATBOT_SYSTEM), *state["messages"]]

    response = await llm.with_retry(stop_after_attempt=LLM_ATTEMPTS).ainvoke(messages)
    return {"messages": [response], "steps": steps + 1}


async def _find_hotel(
    name: str, known_ids: dict[str, str], user_id: str | None
) -> tuple[str | None, list[str]]:
    """Resolve a hotel name to an id, searching for it when this is its first mention.

    Only an exact name match counts, so a loose name cannot become the wrong hotel. New
    ids are recorded in `known_ids`, and the names searched up come back for the refusal.
    """
    known = resolve_hotel(name, known_ids)
    if known:
        return known, []

    found = await shared_search.run_search_hotels({"near": name}, user_id)
    known_ids.update(found.hotel_ids)
    return resolve_hotel(name, found.hotel_ids), list(found.hotel_ids)


def _unknown_hotel(name: str, offered: list[str]) -> ToolOutcome:
    if offered:
        return ToolOutcome(
            f"No hotel is named exactly '{name}'. Searching for it returned: "
            f"{', '.join(offered)}. Use one of those names exactly if the user meant it, "
            "otherwise ask them which they want."
        )
    return ToolOutcome(f"Stayzy has no hotel named '{name}'.")


async def _run_compare(
    args: dict[str, Any], known_ids: dict[str, str], user_id: str | None
) -> ToolOutcome:
    names = [str(name) for name in args.get("hotel_names") or []]
    if not chatbot_search.COMPARE_MIN_HOTELS <= len(names) <= chatbot_search.COMPARE_MAX_HOTELS:
        return ToolOutcome(
            f"Comparing takes {chatbot_search.COMPARE_MIN_HOTELS} to "
            f"{chatbot_search.COMPARE_MAX_HOTELS} hotels, and you named {len(names)}."
        )

    hotel_ids: list[str] = []
    for name in names:
        hotel_id, offered = await _find_hotel(name, known_ids, user_id)
        if not hotel_id:
            return _unknown_hotel(name, offered)
        hotel_ids.append(hotel_id)

    return await chatbot_search.run_compare_hotels(hotel_ids, user_id)


async def _run_one(
    name: str, args: dict[str, Any], known_ids: dict[str, str], user_id: str | None
) -> ToolOutcome:
    if name == "SearchHotels":
        return await shared_search.run_search_hotels(args, user_id)
    if name == "ListMyBookings":
        return await run_list_my_bookings(user_id)
    if name == "ListMyFavorites":
        return await run_list_my_favorites(user_id)
    if name == "CancelBooking":
        return await run_cancel_booking(args, user_id)
    if name == "WriteReview":
        return await run_write_review(args, user_id)
    if name == "CompareHotels":
        return await _run_compare(args, known_ids, user_id)

    if name not in HOTEL_NAME_TOOLS:
        return ToolOutcome(f"There is no tool called '{name}'. Use one you were given.")

    hotel_name = str(args.get("hotel_name", ""))
    hotel_id, offered = await _find_hotel(hotel_name, known_ids, user_id)
    if not hotel_id:
        return _unknown_hotel(hotel_name, offered)

    if name == "GetHotelDetails":
        return await shared_search.run_get_hotel_details(hotel_id, user_id)
    if name == "GetRoomTypes":
        return await chatbot_search.run_get_room_types(hotel_id, args, user_id)
    if name == "GetHotelReviews":
        return await run_get_hotel_reviews(hotel_id, user_id)
    if name == "AddFavorite":
        return await run_add_favorite(hotel_id, hotel_name, user_id)
    return await run_book_room(hotel_id, args, user_id)


async def call_tools(state: ChatbotState, config: RunnableConfig) -> dict[str, Any]:
    """Run the model's tool calls, letting at most one of them change anything.

    `interrupt()` re-runs this node from the start on resume, so a second mutating call
    would re-commit the first. Reads are safe to repeat and run normally.
    """
    user_id = config.get("configurable", {}).get("user_id")
    last = state["messages"][-1]

    messages: list[ToolMessage] = []
    hotel_ids = dict(state.get("hotel_ids") or {})
    actions = list(state.get("actions") or [])
    mutated = False

    for call in last.tool_calls:
        mutating = call["name"] in MUTATING_TOOLS
        if mutating and mutated:
            outcome = SECOND_MUTATION
        else:
            try:
                outcome = await _run_one(call["name"], call["args"], hotel_ids, user_id)
                mutated = mutated or mutating
            except BackendError as exc:
                logger.warning("[graphs/chatbot] %s failed: %s", call["name"], exc)
                outcome = LOOKUP_FAILED
            except KeyError as exc:
                logger.warning("[graphs/chatbot] %s called without %s", call["name"], exc)
                outcome = ToolOutcome(
                    f"That call was missing {exc}. Call it again with every field filled in."
                )

        hotel_ids.update(outcome.hotel_ids)
        if outcome.action:
            actions.append(outcome.action)

        messages.append(
            ToolMessage(content=outcome.text, tool_call_id=call["id"], name=call["name"])
        )

    return {"messages": messages, "hotel_ids": hotel_ids, "actions": actions}


def should_continue(state: ChatbotState) -> str:
    """Loop back for tools while the model is still asking for them."""
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return "end"
