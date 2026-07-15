from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Signals"])

from typing import List
from app.api.schemas import Signal

@router.get("")
def get_signals():
    raw_data = simulation_engine.state.get("signals", [])
    valid_data = [Signal(**item).model_dump() for item in raw_data]
    return {
        "data": valid_data,
        "meta": {"total": len(valid_data)},
        "errors": None
    }

@router.get("/summary")
def get_signals_summary():
    signals = simulation_engine.state.get("signals", [])
    operational = len([signal for signal in signals if signal.get("status") == "operational"])
    degraded = len(
        [
            signal
            for signal in signals
            if 70 <= int(signal.get("health_score", signal.get("health", 100))) < 90
        ]
    )
    maintenance = len([signal for signal in signals if signal.get("maintenance")])
    failed = len([signal for signal in signals if signal.get("status") == "failed"])
    total = len(signals)
    health_percentage = int((operational / total) * 100) if total else 100

    return {
        "data": {
            "total": total,
            "operational": operational,
            "degraded": degraded,
            "maintenance": maintenance,
            "failed": failed,
            "health_percentage": health_percentage,
        },
        "errors": None,
    }
