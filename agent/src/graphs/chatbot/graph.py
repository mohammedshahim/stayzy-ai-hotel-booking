"""The chatbot graph: a tool loop over all 11 tools, checkpointed per session."""

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from src.config import checkpointer as checkpointer_config
from src.graphs.chatbot.nodes import after_tools, call_model, call_tools, should_continue
from src.graphs.chatbot.state import ChatbotState


def build_chatbot_graph() -> CompiledStateGraph:
    """Compile the graph against the pool opened at startup."""
    builder = StateGraph(ChatbotState)
    builder.add_node("agent", call_model)
    builder.add_node("tools", call_tools)

    builder.add_edge(START, "agent")
    builder.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
    builder.add_conditional_edges("tools", after_tools, {"agent": "agent", "end": END})

    return builder.compile(checkpointer=checkpointer_config.checkpointer)
