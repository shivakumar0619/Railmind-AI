from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Trains"])

from typing import List
from app.api.schemas import Train

@router.get("")
def get_trains():
    raw_data = simulation_engine.state.get("trains", [])
    valid_data = [Train(**item).model_dump() for item in raw_data]
    return {
        "data": valid_data,
        "meta": {"total": len(valid_data)},
        "errors": None
    }
