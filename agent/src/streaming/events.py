"""The SSE event vocabulary, shared by every streaming route.

Frames are `data:`-only with the kind inside the JSON: `useChatStream` parses the
whole frame, so an `event:` line would break it.
"""

import json
from typing import Any


def _frame(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def token(text: str, message_id: str) -> str:
    """One chunk of assistant text, tagged with the reply it belongs to."""
    return _frame({"type": "token", "text": text, "id": message_id})


def drop(message_id: str) -> str:
    """Retract a reply already streamed, when the model is about to write it again."""
    return _frame({"type": "drop", "id": message_id})


def tool_start(tool: str) -> str:
    """A tool call has begun."""
    return _frame({"type": "tool_start", "tool": tool})


def tool_end(tool: str, summary: str) -> str:
    """A tool call finished, with a short human-readable outcome."""
    return _frame({"type": "tool_end", "tool": tool, "summary": summary})


def action(payload: dict[str, Any]) -> str:
    """A proposal the user may click. Never performed by the assistant itself."""
    return _frame({"type": "action", **payload})


def confirm(envelope: dict[str, Any]) -> str:
    """The turn has paused for the user to approve or refuse an action."""
    return _frame({"type": "confirm", **envelope})


def done() -> str:
    """The turn is complete."""
    return _frame({"type": "done"})


def error(message: str) -> str:
    """A failure the user should see, in place of a truncated reply."""
    return _frame({"type": "error", "message": message})
