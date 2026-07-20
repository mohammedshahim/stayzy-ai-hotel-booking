"""Mounts every router.

One module per feature, all mounted here — nothing is registered directly on
the app in `main.py`.
"""

from fastapi import APIRouter

from src.api import health_routes

api_router = APIRouter()
api_router.include_router(health_routes.router)
