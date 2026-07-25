"""The pause every mutating tool takes before it writes anything.

One envelope for all four actions, so Feature 48 renders a single confirmation card.
Resuming the graph answers it: `{"approved": true}` or a bare boolean.

`interrupt()` re-runs its node from the start on resume, so everything a runner does
before calling this must be a read it can safely repeat.
"""

from typing import Any

from langgraph.types import interrupt

from src.tools.outcome import ToolOutcome

DECLINED = ToolOutcome(
    "The user declined that action, so nothing was changed. Do not propose it again "
    "unless they ask. Acknowledge briefly and offer something else."
)


def confirm(action: str, title: str, lines: list[tuple[str, str]], confirm_label: str) -> bool:
    """Pause with the real details of the action, and report whether it was approved."""
    decision = interrupt(
        {
            "action": action,
            "title": title,
            "lines": [{"label": label, "value": value} for label, value in lines],
            "confirm_label": confirm_label,
        }
    )
    return _is_approved(decision)


def _is_approved(decision: Any) -> bool:
    """Anything that is not an explicit approval is a refusal."""
    if isinstance(decision, bool):
        return decision
    if isinstance(decision, dict):
        return decision.get("approved") is True
    return False
