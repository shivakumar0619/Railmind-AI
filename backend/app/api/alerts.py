from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Alerts"])

@router.get("")
def get_alerts():
    return {
        "data": simulation_engine.state.get("alerts", []),
        "meta": {"total": len(simulation_engine.state.get("alerts", []))},
        "errors": None
    }
