from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Signals"])

@router.get("")
def get_signals():
    return {
        "data": simulation_engine.state.get("signals", []),
        "meta": {"total": len(simulation_engine.state.get("signals", []))},
        "errors": None
    }
