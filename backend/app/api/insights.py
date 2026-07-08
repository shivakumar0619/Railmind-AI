from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Insights"])

@router.get("")
def get_insights():
    return {
        "data": simulation_engine.state.get("insights", []),
        "meta": {"total": len(simulation_engine.state.get("insights", []))},
        "errors": None
    }
