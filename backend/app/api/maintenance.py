from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Maintenance"])

@router.get("")
def get_maintenance():
    return {
        "data": simulation_engine.state.get("maintenance", []),
        "meta": {"total": len(simulation_engine.state.get("maintenance", []))},
        "errors": None
    }
