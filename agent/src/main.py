"""FastAPI entrypoint.

Neither frontend calls this service. Every AI feature is a `backend/` route
that calls in here with the internal service secret.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from src.api.router import api_router
from src.clients import backend_client
from src.config import checkpointer
from src.config.settings import settings
from src.middlewares.error_handler import register_error_handlers

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Open the checkpointer pool on boot; close it and the HTTP client on shutdown."""
    await checkpointer.open_pool()
    logger.info("[main/lifespan] checkpointer pool open")

    yield

    await checkpointer.close_pool()
    await backend_client.close()
    logger.info("[main/lifespan] shutdown complete")


# No CORS middleware: no browser ever calls this service directly.
app = FastAPI(title="Stayzy Agent", version="0.1.0", lifespan=lifespan)
register_error_handlers(app)
app.include_router(api_router)


def main() -> None:
    """Run the development server."""
    uvicorn.run(
        "src.main:app",
        host="127.0.0.1",
        port=settings.port,
        reload=True,
        # Watch only our own code — the default includes .venv and reload-loops.
        reload_dirs=["src"],
    )


if __name__ == "__main__":
    main()
