"""The chat widget graph: a read-only tool loop, checkpointed per session."""

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from src.config import checkpointer as checkpointer_config
from src.graphs.chat_widget.nodes import (
    after_tools,
    call_model,
    call_tools,
    prepare_context,
    should_continue,
)
from src.graphs.chat_widget.state import WidgetState


def build_widget_graph() -> CompiledStateGraph:
    """Compile the graph against the pool opened at startup."""
    builder = StateGraph(WidgetState)
    builder.add_node("prepare_context", prepare_context)
    builder.add_node("agent", call_model)
    builder.add_node("tools", call_tools)

    builder.add_edge(START, "prepare_context")
    builder.add_edge("prepare_context", "agent")
    builder.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
    builder.add_conditional_edges("tools", after_tools, {"agent": "agent", "end": END})

    return builder.compile(checkpointer=checkpointer_config.checkpointer)
