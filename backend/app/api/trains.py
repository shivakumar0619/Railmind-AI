from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Trains"])

@router.get("")
def get_trains():
    return {
        "data": simulation_engine.state.get("trains", []),
        "meta": {"total": len(simulation_engine.state.get("trains", []))},
        "errors": None
    }
