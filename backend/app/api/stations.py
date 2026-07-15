from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Stations"])

from typing import List
from app.api.schemas import Station

@router.get("")
def get_stations():
    raw_data = simulation_engine.state.get("stations", [])
    valid_data = [Station(**item).model_dump() for item in raw_data]
    return {
        "data": valid_data,
        "meta": {"total": len(valid_data)},
        "errors": None
    }
