from fastapi import APIRouter

from app.api.v1.overview import router as overview_router
from app.api.v1.repositories import router as repositories_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(repositories_router)
api_v1_router.include_router(overview_router)
