"""API route registration for RailMind AI."""

from fastapi import APIRouter

from app.api.dashboard import router as dashboard_router
from app.api.stations import router as stations_router
from app.api.trains import router as trains_router
from app.api.signals import router as signals_router
from app.api.alerts import router as alerts_router
from app.api.routes_api import router as routes_router
from app.api.maintenance import router as maintenance_router
from app.api.weather import router as weather_router
from app.api.insights import router as insights_router

router = APIRouter()

router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
router.include_router(stations_router, prefix="/stations", tags=["Stations"])
router.include_router(trains_router, prefix="/trains", tags=["Trains"])
router.include_router(signals_router, prefix="/signals", tags=["Signals"])
router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
router.include_router(routes_router, prefix="/routes", tags=["Routes"])
router.include_router(maintenance_router, prefix="/maintenance", tags=["Maintenance"])
router.include_router(weather_router, prefix="/weather", tags=["Weather"])
router.include_router(insights_router, prefix="/insights", tags=["Insights"])
