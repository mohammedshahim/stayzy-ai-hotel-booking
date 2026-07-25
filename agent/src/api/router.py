"""Mounts every router.

One module per feature, all mounted here — nothing is registered directly on
the app in `main.py`.
"""

from fastapi import APIRouter

from src.api import (
    chat_widget_routes,
    chatbot_routes,
    health_routes,
    smart_search_routes,
    summary_routes,
)

api_router = APIRouter()
api_router.include_router(health_routes.router)
api_router.include_router(summary_routes.router)
api_router.include_router(smart_search_routes.router)
api_router.include_router(chat_widget_routes.router)
api_router.include_router(chatbot_routes.router)
