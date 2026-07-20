"""LangGraph checkpointer — graph execution state, keyed by thread_id.

Its tables live in their own Postgres schema, and its schema is created by
`uv run setup-checkpointer`, never on boot. Both are explained in
`agent/README.md`.
"""

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from src.config.settings import settings

# Set by open_pool() during app startup; graphs import and use it directly.
checkpointer: AsyncPostgresSaver | None = None

_pool: AsyncConnectionPool | None = None


def conn_string() -> str:
    """Agent database URL with `search_path` pinned to the checkpointer schema.

    A libpq `options` parameter rather than a session `SET`, so it survives
    pool reconnects.
    """
    separator = "&" if "?" in settings.agent_database_url else "?"
    return (
        f"{settings.agent_database_url}{separator}"
        f"options=-csearch_path%3D{settings.checkpointer_schema}"
    )


async def open_pool() -> None:
    """Open the connection pool and build the checkpointer. Never runs DDL."""
    global checkpointer, _pool

    _pool = AsyncConnectionPool(
        conninfo=conn_string(),
        min_size=1,
        max_size=10,
        kwargs={"autocommit": True, "prepare_threshold": 0, "row_factory": dict_row},
        open=False,
    )
    await _pool.open(wait=True)
    checkpointer = AsyncPostgresSaver(conn=_pool)  # type: ignore[arg-type]


async def close_pool() -> None:
    """Close the connection pool."""
    global checkpointer, _pool

    if _pool is not None:
        await _pool.close()
    _pool = None
    checkpointer = None
