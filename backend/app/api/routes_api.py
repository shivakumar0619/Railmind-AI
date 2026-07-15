from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.simulation import simulation_engine
from app.services.routing_service import routing_service

router = APIRouter(tags=["Routes"])

from typing import List
from app.api.schemas import Route

@router.get("")
def get_routes():
    raw_data = simulation_engine.state.get("routes", [])
    valid_data = [Route(**item).model_dump() for item in raw_data]
    return {
        "data": valid_data,
        "meta": {"total": len(valid_data)},
        "errors": None
    }

@router.get("/plan")
def plan_route(
    origin: str = Query(..., description="Origin station code"),
    destination: str = Query(..., description="Destination station code"),
    via: Optional[str] = Query(None, description="Via station code"),
    preference: str = Query("fastest", description="Preference: fastest or shortest")
):
    plan = routing_service.plan_route(origin.upper(), destination.upper(), via.upper() if via else None, preference)
    if not plan:
        raise HTTPException(status_code=404, detail="Route not found")
        
    return {
        "data": plan,
        "meta": {"origin": origin, "destination": destination, "via": via},
        "errors": None
    }
