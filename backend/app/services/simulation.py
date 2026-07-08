import asyncio
import json
import os
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from app.utils.logger import get_logger

logger = get_logger(__name__)

MOCK_DATA_DIR = Path(__file__).parent.parent / "mock_data"


class SimulationEngine:
    def __init__(self):
        self.running = False
        self.state: Dict[str, Any] = {
            "stations": [],
            "routes": [],
            "signals": [],
            "trains": [],
            "alerts": [],
            "insights": [],
            "maintenance": [],
            "weather": {},
            "config": {},
            "analytics": {
                "train_performance_7d": [],
                "alerts_by_severity": [],
                "signal_health_distribution": []
            }
        }
        self.load_data()

    def load_data(self):
        """Load initial state from JSON files."""
        for key in ["stations", "routes", "signals", "trains", "alerts", "maintenance", "weather", "config"]:
            path = MOCK_DATA_DIR / f"{key}.json"
            if path.exists():
                with open(path, "r") as f:
                    self.state[key] = json.load(f)
            else:
                logger.warning(f"Mock data file {key}.json not found.")

        # Initialize mock analytics
        self.state["analytics"] = {
            "train_performance_7d": [
                {"date": "Jul 01", "on_time": 92, "delayed": 8},
                {"date": "Jul 02", "on_time": 94, "delayed": 6},
                {"date": "Jul 03", "on_time": 89, "delayed": 11},
                {"date": "Jul 04", "on_time": 95, "delayed": 5},
                {"date": "Jul 05", "on_time": 96, "delayed": 4},
                {"date": "Jul 06", "on_time": 91, "delayed": 9},
                {"date": "Today", "on_time": 93, "delayed": 7},
            ],
            "alerts_by_severity": [
                {"severity": "Critical", "count": 1},
                {"severity": "High", "count": 3},
                {"severity": "Medium", "count": 8},
                {"severity": "Low", "count": 12},
            ],
            "signal_health_distribution": [
                {"status": "Healthy (>90%)", "count": 412},
                {"status": "Degraded (70-90%)", "count": 18},
                {"status": "Maintenance (<70%)", "count": 5},
            ]
        }
        logger.info("Simulation data loaded.")

    async def start(self):
        """Start the background simulation loop."""
        self.running = True
        tick_rate_ms = self.state["config"].get("tick_rate_ms", 2000)
        tick_interval = tick_rate_ms / 1000.0

        while self.running:
            self._tick()
            await asyncio.sleep(tick_interval)

    def stop(self):
        """Stop the simulation loop."""
        self.running = False

    def _tick(self):
        """Perform one simulation step."""
        multiplier = self.state["config"].get("simulation_speed_multiplier", 60)
        
        # Move trains
        for train in self.state["trains"]:
            if train["status"] == "running":
                # Find route to get distance
                route = next((r for r in self.state["routes"] if r["id"] == train["current_route_id"]), None)
                if route:
                    # distance moved in this tick = (speed in km/h) * (1 hr / 3600 s) * (tick_interval * multiplier in s)
                    # For a 1-second tick at 60x multiplier, it's 1 simulated minute.
                    # At 120km/h, 1 minute = 2km.
                    tick_duration_s = self.state["config"].get("tick_rate_ms", 1000) / 1000.0
                    sim_seconds = tick_duration_s * multiplier
                    dist_moved = train["current_speed_kmh"] * (sim_seconds / 3600.0)
                    
                    # Convert to percentage of route
                    pct_moved = (dist_moved / route["distance_km"]) * 100
                    train["progress_pct"] += pct_moved

                    if train["progress_pct"] >= 100:
                        train["progress_pct"] = 0
                        # Very simplified: just stop the train at the end of the route for now
                        train["status"] = "stopped"
                        train["current_speed_kmh"] = 0
        
        # Update signals based on train positions (Simple block logic)
        for sig in self.state["signals"]:
            sig["aspect"] = "clear"
            
        for train in self.state["trains"]:
            if train["status"] == "running":
                route = next((r for r in self.state["routes"] if r["id"] == train["current_route_id"]), None)
                if route:
                    # Find which block the train is in
                    route_signals = sorted([s for s in self.state["signals"] if s["route_id"] == route["id"]], key=lambda x: x["block_index"])
                    if route_signals:
                        block_idx = int((train["progress_pct"] / 100) * len(route_signals))
                        block_idx = min(block_idx, len(route_signals) - 1)
                        # Set current block signal to red
                        route_signals[block_idx]["aspect"] = "stop"
                        # Set previous block to caution
                        if block_idx > 0:
                            route_signals[block_idx - 1]["aspect"] = "caution"

        # Generate random delays/alerts/signal degradation
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # 1. Signal degradation
        if random.random() < self.state["config"].get("signal_degradation_chance", 0.05):
            sig = random.choice(self.state["signals"])
            if sig["health_score"] > 50:
                sig["health_score"] -= random.randint(5, 15)
                if sig["health_score"] < 70 and not any(a["title"].startswith("Signal Degradation") and not a["resolved"] for a in self.state["alerts"]):
                    # Generate alert
                    self.state["alerts"].insert(0, {
                        "id": f"alert_{int(datetime.now().timestamp())}_sig",
                        "severity": "medium",
                        "title": f"Signal Degradation: {sig['id']}",
                        "description": f"Signal health dropped to {sig['health_score']}%. Maintenance advised.",
                        "station_code": sig["id"].split("_")[1], # sig_SC_BG_0
                        "created_at": now_iso,
                        "acknowledged": False,
                        "resolved": False
                    })

        # 2. Train delays
        if random.random() < self.state["config"].get("random_delay_chance", 0.05):
            running_trains = [t for t in self.state["trains"] if t["status"] == "running"]
            if running_trains:
                t = random.choice(running_trains)
                t["delay_minutes"] += 5
                
                # Check for existing alert for this train
                existing = next((a for a in self.state["alerts"] if f"Train {t['number']}" in a["title"] and not a["resolved"]), None)
                if not existing:
                    route = next((r for r in self.state["routes"] if r["id"] == t["current_route_id"]), None)
                    st_code = route["source_code"] if route else "UNK"
                    self.state["alerts"].insert(0, {
                        "id": f"alert_{int(datetime.now().timestamp())}_tr",
                        "severity": "high",
                        "title": f"Train {t['number']} Delayed",
                        "description": f"Train {t['name']} delayed by {t['delay_minutes']} minutes.",
                        "station_code": st_code,
                        "created_at": now_iso,
                        "acknowledged": False,
                        "resolved": False
                    })
                else:
                    existing["description"] = f"Train {t['name']} delayed by {t['delay_minutes']} minutes."
                    existing["created_at"] = now_iso
                    existing["acknowledged"] = False # Un-acknowledge on update
                
        # 3. Generate AI Insights based on current alerts and delays
        # Clear old insights and regenerate based on current state
        new_insights = []
        delayed_trains = [t for t in self.state["trains"] if t["delay_minutes"] > 0]
        degraded_signals = [s for s in self.state["signals"] if s["health_score"] < 70]
        
        if delayed_trains:
            worst = max(delayed_trains, key=lambda x: x["delay_minutes"])
            new_insights.append({
                "title": "Delay Prediction & Rerouting",
                "desc": f"Train {worst['number']} ({worst['name']}) is delayed by {worst['delay_minutes']}m. Rerouting via loop line recommended to avoid cascading delays.",
                "type": "routing",
                "severity": "warning"
            })
            
        if degraded_signals:
            new_insights.append({
                "title": "Predictive Maintenance",
                "desc": f"{len(degraded_signals)} signal(s) show anomalous degradation patterns. Preventive maintenance dispatched could reduce failure probability by 85%.",
                "type": "maintenance",
                "severity": "danger"
            })
            
        if not delayed_trains and not degraded_signals:
            new_insights.append({
                "title": "Network Optimal",
                "desc": "All corridor sections are operating within optimal parameters. Energy efficiency profile is active.",
                "type": "efficiency",
                "severity": "success"
            })
            
        self.state["insights"] = new_insights

        # Keep only the 50 most recent alerts
        if len(self.state["alerts"]) > 50:
            self.state["alerts"] = self.state["alerts"][:50]


# Global singleton instance
simulation_engine = SimulationEngine()
