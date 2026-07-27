"""OpenRouter chat clients.

OpenRouter speaks the OpenAI protocol, so `langchain-openai` is the client.
Model names live in settings, never at a call site.
"""

from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from src.config.settings import settings


def _build(model: str, temperature: float) -> ChatOpenAI:
    return ChatOpenAI(
        model=model,
        base_url=settings.openrouter_base_url,
        api_key=SecretStr(settings.openrouter_api_key),
        temperature=temperature,
        # langchain-openai leaves this off when base_url is custom, so streamed turns lose tokens.
        stream_usage=True,
    )


def get_fast_llm(temperature: float = 0.2) -> ChatOpenAI:
    """Client for summaries and query extraction — short, high volume, cheap."""
    return _build(settings.openrouter_model_fast, temperature)


def get_smart_llm(temperature: float = 0.2) -> ChatOpenAI:
    """Client for the chatbot's tool loop — multi-step reasoning over many tools."""
    return _build(settings.openrouter_model_smart, temperature)
