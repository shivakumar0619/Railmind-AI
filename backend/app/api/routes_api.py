from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.simulation import simulation_engine
from app.services.routing_service import routing_service

router = APIRouter(tags=["Routes"])

@router.get("")
def get_routes():
    return {
        "data": simulation_engine.state.get("routes", []),
        "meta": {"total": len(simulation_engine.state.get("routes", []))},
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
