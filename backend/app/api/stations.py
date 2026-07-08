from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Stations"])

@router.get("")
def get_stations():
    return {
        "data": simulation_engine.state.get("stations", []),
        "meta": {"total": len(simulation_engine.state.get("stations", []))},
        "errors": None
    }
