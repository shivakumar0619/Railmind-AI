from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Weather"])

@router.get("")
def get_weather():
    return {
        "data": simulation_engine.state.get("weather", {}),
        "errors": None
    }
