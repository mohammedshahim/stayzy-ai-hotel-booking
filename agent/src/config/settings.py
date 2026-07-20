"""Environment configuration, validated once at import.

Same shape as `backend/src/config/env.ts`: if a required variable is missing,
the app refuses to start and names it.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated environment for `agent/`."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 4100

    # Same database as backend's DATABASE_URL, in its own schema.
    agent_database_url: str
    checkpointer_schema: str = "agent"

    # backend/ is the only service agent/ ever calls.
    backend_internal_url: str
    internal_service_secret: str

    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model_fast: str = "nvidia/nemotron-3-ultra-550b-a55b:free"
    openrouter_model_smart: str = "nvidia/nemotron-3-ultra-550b-a55b:free"

    backend_request_timeout_seconds: float = 15.0


# No localhost defaults on the URLs above — an unset production value would
# boot fine and then fail silently. See agent/README.md.
settings = Settings()  # type: ignore[call-arg]  # values come from the environment
