"""Create the checkpointer schema and its tables.

    uv run setup-checkpointer

Run once per environment, and again after upgrading
`langgraph-checkpoint-postgres`. Idempotent — the library tracks its own
migrations and applies only what is missing. Why this is a command rather than
a boot-time hook is explained in `agent/README.md`.
"""

import asyncio
import logging

import psycopg
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg.rows import dict_row

from src.config.checkpointer import pin_search_path
from src.config.settings import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

EXPECTED_TABLES = {
    "checkpoints",
    "checkpoint_blobs",
    "checkpoint_writes",
    "checkpoint_migrations",
}


async def setup() -> None:
    """Create the schema, run the checkpointer's migrations, verify the result."""
    schema = settings.checkpointer_schema

    # A schema name is an identifier, so it cannot be a bound parameter.
    if not schema.replace("_", "").isalnum():
        raise ValueError(f"[scripts/setup_checkpointer] unsafe schema name: {schema!r}")

    # Must exist before setup() runs — search_path cannot resolve to a missing schema.
    async with await psycopg.AsyncConnection.connect(
        settings.agent_database_url, autocommit=True
    ) as conn:
        await conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema}"')
    logger.info("[scripts/setup_checkpointer] schema %r ready", schema)

    # autocommit, because setup() issues CREATE INDEX CONCURRENTLY.
    async with await psycopg.AsyncConnection.connect(
        settings.agent_database_url,
        autocommit=True,
        prepare_threshold=0,
        row_factory=dict_row,  # type: ignore[arg-type]
    ) as conn:
        await pin_search_path(conn)
        await AsyncPostgresSaver(conn=conn).setup()  # type: ignore[arg-type]

    async with await psycopg.AsyncConnection.connect(
        settings.agent_database_url, autocommit=True
    ) as conn:
        result = await conn.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = %s",
            (schema,),
        )
        found = {row[0] for row in await result.fetchall()}

    missing = EXPECTED_TABLES - found
    if missing:
        raise RuntimeError(
            f"[scripts/setup_checkpointer] tables missing from schema {schema!r}: {sorted(missing)}"
        )

    logger.info(
        "[scripts/setup_checkpointer] verified %d tables in schema %r",
        len(EXPECTED_TABLES),
        schema,
    )


def main() -> None:
    """Entry point for `uv run setup-checkpointer`."""
    asyncio.run(setup())


if __name__ == "__main__":
    main()
