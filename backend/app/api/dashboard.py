from fastapi import APIRouter
from app.services.simulation import simulation_engine

router = APIRouter(tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats():
    trains = simulation_engine.state.get("trains", [])
    signals = simulation_engine.state.get("signals", [])
    alerts = simulation_engine.state.get("alerts", [])
    stations = simulation_engine.state.get("stations", [])
    
    active_trains = len([t for t in trains if t.get("status") == "running"])
    delayed_trains = len([t for t in trains if t.get("delay_minutes", 0) > 0])
    
    # Calculate signal health (percentage of non-stop signals)
    healthy_signals = len([s for s in signals if s.get("aspect") in ("clear", "attention", "caution")])
    total_signals = len(signals) if len(signals) > 0 else 1
    signal_health = int((healthy_signals / total_signals) * 100)
    
    active_alerts = len([a for a in alerts if not a.get("acknowledged")])
    critical_alerts = len([a for a in alerts if a.get("severity") == "critical" and not a.get("acknowledged")])
    
    # On time performance
    on_time = active_trains - delayed_trains
    on_time_performance = int((on_time / active_trains) * 100) if active_trains > 0 else 100
    
    return {
        "data": {
            "active_trains": active_trains,
            "total_stations": len(stations),
            "on_time_performance": on_time_performance,
            "signal_health": signal_health,
            "active_alerts": active_alerts,
            "critical_alerts": critical_alerts,
            "corridor": "Secunderabad - Vijayawada"
        },
        "errors": None
    }

@router.get("/recent-alerts")
def get_recent_alerts():
    alerts = simulation_engine.state.get("alerts", [])
    # Sort by created_at desc
    sorted_alerts = sorted(alerts, key=lambda x: x.get("created_at", ""), reverse=True)
    return {
        "data": sorted_alerts[:10],
        "errors": None
    }

@router.get("/analytics")
def get_analytics():
    return {
        "data": simulation_engine.state.get("analytics", {}),
        "errors": None
    }

@router.get("/system-status")
def get_system_status():
    runtime = simulation_engine.state.get("runtime", {})
    return {
        "data": {
            "components": [
                {"name": "Backend API", "status": runtime.get("backend_status", "operational"), "uptime": "99.99%"},
                {"name": "Database", "status": runtime.get("database_status", "json-simulation"), "uptime": "simulation"},
                {"name": "Simulation Engine", "status": runtime.get("simulation_status", "standby"), "uptime": "active"},
                {"name": "Map Telemetry", "status": "operational", "uptime": "99.97%"},
                {"name": "Alert Processor", "status": "operational", "uptime": "99.94%"},
            ],
            "overall": "operational",
            "backend_status": runtime.get("backend_status", "operational"),
            "database_status": runtime.get("database_status", "json-simulation"),
            "simulation_status": runtime.get("simulation_status", "standby"),
            "api_latency_ms": runtime.get("api_latency_ms", 24),
            "memory_usage_mb": runtime.get("memory_usage_mb", 186),
            "cpu_usage_percent": runtime.get("cpu_usage_percent", 18),
            "running_trains": runtime.get("running_trains", 0),
            "running_signals": runtime.get("running_signals", 0),
            "simulation_tick": runtime.get("simulation_tick", 0),
            "docker_status": runtime.get("docker_status", "not_checked"),
            "timestamp": runtime.get("timestamp"),
        },
        "errors": None
    }
