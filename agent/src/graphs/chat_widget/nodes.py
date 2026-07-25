"""The widget graph's nodes: context preparation, the model turn, and tool dispatch."""

import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig

from src.clients.backend_client import BackendError
from src.config.llm import get_smart_llm
from src.graphs.chat_widget.prompts import CONTEXT_CURRENT, CONTEXT_EARLIER, WIDGET_SYSTEM
from src.graphs.chat_widget.state import WidgetState
from src.graphs.chat_widget.tools.widget_tools import TOOL_SCHEMAS, to_chip_filters
from src.tools.outcome import ToolOutcome
from src.tools.search_tools import run_get_hotel_details, run_search_hotels

logger = logging.getLogger(__name__)

# Too low a ceiling returns empty content, not short content — see hotel_summary_chain.
MAX_TOKENS = 1200

LLM_ATTEMPTS = 3

# Past this the tools are left unbound so the model must reply in words.
MAX_TOOL_LOOPS = 4


def _label(context: dict | None) -> str | None:
    if not context:
        return None
    return context.get("hotel_name") or context.get("summary") or context.get("path")


def prepare_context(state: WidgetState) -> dict[str, Any]:
    """Record the page this turn happened on, and trust its hotel id."""
    context = state.get("context")
    viewed = list(state.get("viewed") or [])
    label = _label(context)
    if label and (not viewed or viewed[-1] != label):
        viewed.append(label)

    hotel_ids = dict(state.get("hotel_ids") or {})
    if context and context.get("hotel_name") and context.get("hotel_id"):
        hotel_ids[context["hotel_name"]] = context["hotel_id"]

    return {"viewed": viewed, "hotel_ids": hotel_ids, "actions": [], "steps": 0}


def _context_messages(state: WidgetState) -> list[SystemMessage]:
    viewed = state.get("viewed") or []
    if not viewed:
        return []

    blocks = [CONTEXT_CURRENT.format(label=viewed[-1])]
    earlier = viewed[:-1]
    if earlier:
        blocks.append(CONTEXT_EARLIER.format(labels=", ".join(earlier)))

    return [SystemMessage(content="\n".join(blocks))]


async def call_model(state: WidgetState) -> dict[str, Any]:
    """One model turn, with the current page injected fresh ahead of the history."""
    steps = state.get("steps", 0)

    llm = get_smart_llm().bind(max_tokens=MAX_TOKENS)
    if steps < MAX_TOOL_LOOPS:
        llm = llm.bind_tools(TOOL_SCHEMAS)

    # Last, not after the system prompt, or the newest hotel mentioned wins over it.
    messages = [
        SystemMessage(content=WIDGET_SYSTEM),
        *state["messages"],
        *_context_messages(state),
    ]

    response = await llm.with_retry(stop_after_attempt=LLM_ATTEMPTS).ainvoke(messages)
    return {"messages": [response], "steps": steps + 1}


def _resolve_hotel(name: str, hotel_ids: dict[str, str]) -> str | None:
    exact = hotel_ids.get(name)
    if exact:
        return exact
    lowered = name.strip().lower()
    for known, hotel_id in hotel_ids.items():
        if known.lower() == lowered:
            return hotel_id
    return None


async def _run_one(
    name: str, args: dict[str, Any], state: WidgetState, user_id: str | None
) -> tuple[ToolOutcome, dict[str, Any] | None]:
    hotel_ids = state.get("hotel_ids") or {}

    if name == "SearchHotels":
        return await run_search_hotels(args, user_id), None

    if name == "GetHotelDetails":
        hotel_id = _resolve_hotel(str(args.get("hotel_name", "")), hotel_ids)
        if not hotel_id:
            return ToolOutcome("That hotel has not come up yet. Search for it first.", {}), None
        return await run_get_hotel_details(hotel_id, user_id), None

    if name == "ProposeSearch":
        action = {"kind": "navigate", "label": args["label"], "filters": to_chip_filters(args)}
        return ToolOutcome(f"Offered the user a chip: {args['label']}", {}), action

    hotel_name = str(args.get("hotel_name", ""))
    hotel_id = _resolve_hotel(hotel_name, hotel_ids)
    if not hotel_id:
        return ToolOutcome(f"No chip offered — {hotel_name} has not come up yet.", {}), None

    kind = "open_hotel" if name == "ProposeHotel" else "compare"
    action = {"kind": kind, "label": args["label"], "hotelId": hotel_id, "hotelName": hotel_name}
    return ToolOutcome(f"Offered the user a chip: {args['label']}", {}), action


def _chip_key(action: dict[str, Any]) -> tuple[str, str]:
    """Two chips are the same offer when the hotel matches, or the label for a search."""
    return action["kind"], action.get("hotelId") or action["label"]


async def call_tools(state: WidgetState, config: RunnableConfig) -> dict[str, Any]:
    """Run every tool the model asked for, collecting ids and chips as they go."""
    user_id = config.get("configurable", {}).get("user_id")
    last = state["messages"][-1]

    messages: list[ToolMessage] = []
    hotel_ids = dict(state.get("hotel_ids") or {})
    actions = list(state.get("actions") or [])
    offered = {_chip_key(action) for action in actions}

    for call in last.tool_calls:
        try:
            outcome, action = await _run_one(call["name"], call["args"], state, user_id)
        except BackendError as exc:
            logger.warning("[graphs/chat_widget] %s failed: %s", call["name"], exc)
            outcome, action = ToolOutcome("That lookup failed. Tell the user, briefly.", {}), None

        hotel_ids.update(outcome.hotel_ids)
        state = {**state, "hotel_ids": hotel_ids}

        if action:
            key = _chip_key(action)
            if key in offered:
                outcome = ToolOutcome(
                    f"'{action['label']}' is already on screen. Do not offer it again — "
                    "answer the user instead.",
                    {},
                )
            else:
                offered.add(key)
                actions.append(action)

        messages.append(
            ToolMessage(content=outcome.text, tool_call_id=call["id"], name=call["name"])
        )

    return {"messages": messages, "hotel_ids": hotel_ids, "actions": actions}


def should_continue(state: WidgetState) -> str:
    """Loop back for tools while the model is still asking for them."""
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return "end"
