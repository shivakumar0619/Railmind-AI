from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Routes"])

@router.get("")
def get_routes():
    return {
        "data": simulation_engine.state.get("routes", []),
        "meta": {"total": len(simulation_engine.state.get("routes", []))},
        "errors": None
    }
