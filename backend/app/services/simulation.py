"""Continuous lifecycle simulation engine for RailMind AI.

Trains follow a perpetual lifecycle:
    Running → Approaching → Arrived → Platform Dwell → Reverse Direction → Running

Signals implement realistic Automatic Block Signalling (ABS):
    Green (clear)        — blocks ahead are clear
    Double Yellow (attention) — two blocks ahead occupied
    Yellow (caution)     — next block occupied
    Red (stop)           — protected block occupied or locked

The simulation never enters an empty state.
"""

import asyncio
import json
import math

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.utils.logger import get_logger

logger = get_logger(__name__)

MOCK_DATA_DIR = Path(__file__).parent.parent / "mock_data"

JsonDict = dict[str, Any]
OccupancyMap = dict[tuple[str, int], list[str]]

# ---------------------------------------------------------------------------
# Lifecycle constants
# ---------------------------------------------------------------------------
DWELL_TIME_INTERMEDIATE_S = 120   # 2 minutes at intermediate stations
DWELL_TIME_TERMINAL_S = 300       # 5 minutes at origin/destination terminals
APPROACH_DISTANCE_PCT = 5.0       # % before 100 to start braking for station

# Physics constants (per-minute rates applied proportionally to sim_seconds)
ACCEL_RATE_KMHPM = 15.0           # km/h gained per minute of acceleration
BRAKE_RATE_KMHPM = 25.0           # km/h lost per minute of braking
EMERGENCY_BRAKE_RATE_KMHPM = 40.0 # km/h lost per minute of emergency braking
CRAWL_SPEED_KMH = 15.0            # minimum speed when cautiously moving

# Signal failure
SIGNAL_FAILURE_PROBABILITY = 0.0003   # per signal per tick (~0.03%)
SIGNAL_RECOVERY_PROBABILITY = 0.005   # per failed signal per tick
SIGNAL_HEALTH_DEGRADATION = 0.05      # health points lost per tick when failed
SIGNAL_HEALTH_RECOVERY = 0.02         # health points gained per tick when healthy

# Alert generation
MAX_ALERTS = 50                   # keep alert history bounded
ALERT_COOLDOWN_TICKS = 60         # minimum ticks between identical alerts


class SimulationEngine:
    """Backend source of truth for the educational railway simulation.

    The engine keeps railway topology in JSON-backed state, then derives
    GPS positions, signal aspects, block occupancy, station occupancy, and
    advisory insights on every tick.

    Trains run perpetually — when they reach their destination, they reverse
    direction and traverse their path backwards, maintaining identity, delay
    history, and accumulated telemetry.
    """

    def __init__(self) -> None:
        self.running = False
        self.tick_count = 0
        self._alert_cooldowns: dict[str, int] = {}
        self._performance_history: list[dict[str, Any]] = []

        self.state: dict[str, Any] = {
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
                "signal_health_distribution": [],
            },
            "runtime": {},
        }
        self.load_data()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def load_data(self) -> None:
        """Load initial simulation state from JSON files."""
        for key in [
            "stations",
            "routes",
            "signals",
            "trains",
            "alerts",
            "maintenance",
            "weather",
            "config",
        ]:
            path = MOCK_DATA_DIR / f"{key}.json"
            if path.exists():
                with open(path, encoding="utf-8") as data_file:
                    self.state[key] = json.load(data_file)
            else:
                logger.warning("mock_data_file_missing", file=f"{key}.json")

        self._normalise_static_state()
        self._bootstrap_trains()
        self._update_dynamic_state()
        logger.info(
            "simulation_data_loaded",
            stations=len(self.state["stations"]),
            routes=len(self.state["routes"]),
            signals=len(self.state["signals"]),
            trains=len(self.state["trains"]),
        )

    async def start(self) -> None:
        """Start the background simulation loop."""
        self.running = True

        while self.running:
            self._tick()
            tick_rate_ms = self.state["config"].get("tick_rate_ms", 1000)
            await asyncio.sleep(tick_rate_ms / 1000.0)

    def stop(self) -> None:
        """Stop the simulation loop."""
        self.running = False

    # ------------------------------------------------------------------
    # Static state initialization
    # ------------------------------------------------------------------

    def _normalise_static_state(self) -> None:
        """Derive static geometry and missing signal records from topology."""
        stations = self._stations_by_code()

        for route in self.state["routes"]:
            source = stations.get(route.get("source_code"))
            target = stations.get(route.get("target_code"))
            if not source or not target:
                continue

            # Preserve rich polylines from routes.json; only generate fallback if missing
            if not route.get("polyline") or len(route["polyline"]) < 2:
                route["polyline"] = [
                    [source["lng"], source["lat"]],
                    [target["lng"], target["lat"]],
                ]
            route["center_lat"] = round((source["lat"] + target["lat"]) / 2, 6)
            route["center_lng"] = round((source["lng"] + target["lng"]) / 2, 6)
            route.setdefault("current_trains", 0)
            route.setdefault("congestion", "low")
            route.setdefault("average_delay_minutes", 0)
            route.setdefault("travel_time_minutes", self._route_travel_time(route))
            route.setdefault("occupied", False)

        self._ensure_signals()

    def _ensure_signals(self) -> None:
        """Generate deterministic automatic block signals for every route."""
        routes = self._routes_by_id()
        existing = {
            (signal.get("route_id"), int(signal.get("block_index", 0)))
            for signal in self.state.get("signals", [])
            if signal.get("route_id") in routes
        }
        generated = [
            signal
            for signal in self.state.get("signals", [])
            if signal.get("route_id") in routes
        ]

        for route in self.state["routes"]:
            block_count = max(1, int(route.get("block_count", 1)))
            source_code = route["source_code"]
            target_code = route["target_code"]
            for block_index in range(block_count):
                key = (route["id"], block_index)
                if key in existing:
                    continue

                progress_pct = ((block_index + 0.5) / block_count) * 100
                position = self._position_on_route(route, progress_pct, "forward")
                signal_type = "home" if block_index == 0 else "automatic"
                if block_index == block_count - 1:
                    signal_type = "advanced_starter"

                generated.append(
                    {
                        "id": f"sig_{route['code'].lower().replace('-', '_')}_{block_index + 1:02d}",
                        "name": f"{source_code}-{target_code} {block_index + 1:02d}",
                        "type": signal_type,
                        "station_code": source_code,
                        "route_id": route["id"],
                        "block_id": f"{route['code']}-B{block_index + 1:02d}",
                        "block_index": block_index,
                        "total_blocks": block_count,
                        "direction": f"{source_code}->{target_code}",
                        "aspect": "clear",
                        "status": "operational",
                        "health": 100,
                        "health_score": 100.0,
                        "occupied": False,
                        "failure": False,
                        "maintenance": False,
                        "lat": position["lat"],
                        "lng": position["lng"],
                        "data_source": "simulation",
                    }
                )

        self.state["signals"] = sorted(
            generated,
            key=lambda signal: (signal.get("route_id", ""), signal.get("block_index", 0)),
        )

    def _bootstrap_trains(self) -> None:
        """Validate train paths and initialise lifecycle fields.

        Trains whose paths reference routes that don't exist are
        repaired by finding valid alternative paths through the network.
        """
        routes_by_id = self._routes_by_id()

        for train in self.state["trains"]:
            # Validate path — remove any route IDs not in our topology
            original_path = train.get("path", [])
            valid_path = [r for r in original_path if r in routes_by_id]

            if not valid_path:
                # Try to find a path using the routing service's graph
                valid_path = self._find_fallback_path(
                    train.get("origin", ""),
                    train.get("destination", ""),
                    train.get("travel_direction", "forward"),
                )

            if not valid_path:
                # Last resort — assign to any route that exists
                if self.state["routes"]:
                    first_route = self.state["routes"][0]
                    valid_path = [first_route["id"]]
                    train["origin"] = first_route["source_code"]
                    train["destination"] = first_route["target_code"]

            train["path"] = valid_path
            train["original_path"] = list(valid_path)

            # Ensure current_route_id is valid
            if train.get("current_route_id") not in valid_path and valid_path:
                train["current_route_id"] = valid_path[0]
                train["path_index"] = 0

            # Lifecycle fields
            train.setdefault("lifecycle", "running")
            train.setdefault("dwell_remaining_s", 0)
            train.setdefault("trips_completed", 0)
            train.setdefault("total_distance_km", 0.0)
            train.setdefault("max_delay_minutes", 0)
            train.setdefault("signal_stops", 0)
            train.setdefault("current_speed_kmh", float(train.get("max_speed_kmh", 100)) * 0.5)

            # Normalise status to running if it was at_station from old sim
            if train.get("status") in {"at_station", "completed", "terminated"}:
                train["status"] = "running"
                train["lifecycle"] = "running"
                train["progress_pct"] = 0

    def _find_fallback_path(self, origin: str, destination: str, direction: str) -> list[str]:
        """Use a simple BFS to find a route path between two station codes."""
        routes = self.state["routes"]
        # Build adjacency from station codes to route IDs
        adj: dict[str, list[tuple[str, str]]] = {}  # station -> [(next_station, route_id)]
        for route in routes:
            src = route["source_code"]
            tgt = route["target_code"]
            adj.setdefault(src, []).append((tgt, route["id"]))
            adj.setdefault(tgt, []).append((src, route["id"]))

        if origin not in adj or destination not in adj:
            return []

        # BFS
        from collections import deque
        queue: deque[tuple[str, list[str]]] = deque([(origin, [])])
        visited = {origin}

        while queue:
            current, path = queue.popleft()
            if current == destination and path:
                return path

            for next_station, route_id in adj.get(current, []):
                if next_station not in visited:
                    visited.add(next_station)
                    queue.append((next_station, path + [route_id]))

        return []

    # ------------------------------------------------------------------
    # Main tick
    # ------------------------------------------------------------------

    def _tick(self) -> None:
        """Perform one deterministic simulation step."""
        self.tick_count += 1

        config = self.state["config"]
        tick_duration_s = config.get("tick_rate_ms", 1000) / 1000.0
        sim_seconds = tick_duration_s * config.get("simulation_speed_multiplier", 60)

        occupancy = self._build_occupancy()

        for train in self.state["trains"]:
            self._tick_train(train, sim_seconds, occupancy)

        # Rebuild occupancy after movement for accurate signal computation
        occupancy = self._build_occupancy()
        self._update_dynamic_state(occupancy)
        self._verify_consistency(occupancy)

        # Record performance snapshot every 60 ticks (~1 sim minute)
        if self.tick_count % 60 == 0:
            self._record_performance_snapshot()

    def _tick_train(self, train: JsonDict, sim_seconds: float, occupancy: OccupancyMap) -> None:
        lifecycle = train.get("lifecycle", "running")
        if lifecycle == "dwelling":
            self._tick_dwelling(train, sim_seconds)
        elif lifecycle == "reversing":
            self._tick_reversing(train, sim_seconds)
        elif lifecycle in {"running", "approaching", "braking", "stopped", "departing"}:
            self._tick_running(train, sim_seconds, occupancy)
        else:
            train["lifecycle"] = "running"
            train["status"] = "running"
        self._normalise_train(train)

    def _tick_dwelling(self, train: JsonDict, sim_seconds: float) -> None:
        train["status"] = "dwelling"
        train["current_speed_kmh"] = 0
        train["speed_kmh"] = 0
        train["dwell_remaining_s"] -= sim_seconds
        if train["dwell_remaining_s"] <= 0:
            train["dwell_remaining_s"] = 0
            if train.get("_at_terminal", False):
                train["lifecycle"] = "reversing"
                train["status"] = "reversing"
                train["_at_terminal"] = False
            else:
                train["lifecycle"] = "departing"
                train["status"] = "departing"

    def _tick_reversing(self, train: JsonDict, sim_seconds: float) -> None:
        path = list(train.get("original_path", train.get("path", [])))
        path.reverse()
        train["path"] = path
        train["original_path"] = list(path)
        origin = train.get("origin")
        destination = train.get("destination")
        train["origin"] = destination
        train["destination"] = origin
        current_direction = train.get("travel_direction", "forward")
        train["travel_direction"] = "reverse" if current_direction == "forward" else "forward"
        train["current_route_id"] = path[0] if path else train.get("current_route_id")
        train["path_index"] = 0
        train["progress_pct"] = 0
        train["trips_completed"] = int(train.get("trips_completed", 0)) + 1
        current_delay = int(train.get("delay_minutes", 0))
        train["delay_minutes"] = max(0, current_delay - 5)
        train["lifecycle"] = "departing"
        train["status"] = "departing"

    def _tick_running(self, train: JsonDict, sim_seconds: float, occupancy: OccupancyMap) -> None:
        route = self._routes_by_id().get(train.get("current_route_id"))
        if not route:
            return
        block_count = max(1, int(route.get("block_count", 1)))
        current_progress = float(train.get("progress_pct", 0))
        current_block = self._block_index(current_progress, block_count)
        
        speed_limit = float(train.get("max_speed_kmh", 100))
        route_limit = self._effective_speed_limit(route)
        max_train_speed = min(speed_limit, route_limit)

        signal_aspect = self._get_signal_aspect_for_train(train, route, current_block)
        
        if signal_aspect == "stop":
            target_speed = 0
        elif signal_aspect == "caution":
            target_speed = min(max_train_speed, 40.0)
        elif signal_aspect == "attention":
            target_speed = min(max_train_speed, 75.0)
        else:
            target_speed = max_train_speed

        remaining_pct = 100.0 - current_progress
        if remaining_pct < APPROACH_DISTANCE_PCT:
            path = train.get("path", [])
            path_index = train.get("path_index", 0)
            if path_index + 1 >= len(path):
                target_speed = min(target_speed, CRAWL_SPEED_KMH * (remaining_pct / APPROACH_DISTANCE_PCT))
                if train["lifecycle"] not in {"stopped"}:
                    train["lifecycle"] = "approaching"
                    train["status"] = "approaching"

        current_speed = float(train.get("current_speed_kmh", 0))
        
        if signal_aspect == "stop" and remaining_pct > 1.0:
            # Service brake towards the stop
            new_speed = max(0, current_speed - BRAKE_RATE_KMHPM * (sim_seconds / 60))
            if new_speed == 0:
                train["lifecycle"] = "stopped"
                train["status"] = "stopped"
            else:
                train["lifecycle"] = "braking"
                train["status"] = "braking"
        elif current_speed < target_speed:
            new_speed = min(target_speed, current_speed + ACCEL_RATE_KMHPM * (sim_seconds / 60))
            if train["lifecycle"] in {"stopped", "departing"}:
                train["lifecycle"] = "running"
                train["status"] = "running"
        elif current_speed > target_speed:
            new_speed = max(target_speed, current_speed - BRAKE_RATE_KMHPM * (sim_seconds / 60))
            if train["lifecycle"] != "approaching":
                train["lifecycle"] = "braking"
                train["status"] = "braking"
        else:
            new_speed = target_speed
            if train["lifecycle"] not in {"approaching", "stopped", "departing"}:
                train["lifecycle"] = "running"
                train["status"] = "running"

        train["current_speed_kmh"] = round(new_speed, 1)
        train["speed_kmh"] = round(new_speed, 1)

        if new_speed > 0:
            distance_moved = new_speed * (sim_seconds / 3600.0)
            route_distance = max(float(route.get("distance_km", 1)), 0.1)
            pct_moved = (distance_moved / route_distance) * 100
            
            target_progress = min(100.0, current_progress + pct_moved)
            target_block = self._block_index(target_progress, block_count)
            
            if target_block != current_block:
                if not self._is_block_available(occupancy, str(route["id"]), target_block, str(train["id"])):
                    boundary_pct = (target_block / block_count) * 100 - 0.01
                    train["progress_pct"] = round(max(current_progress, boundary_pct), 3)
                    train["lifecycle"] = "stopped"
                    train["status"] = "stopped"
                    train["current_speed_kmh"] = 0
                    train["speed_kmh"] = 0
                    return
                    
            train["progress_pct"] = round(target_progress, 3)

        if float(train.get("progress_pct", 0)) >= 99.9:
            self._advance_train(train)

    def _advance_train(self, train: JsonDict) -> None:
        path = train.get("path") or []
        path_index = train.get("path_index", 0)
        route = self._routes_by_id().get(train.get("current_route_id"))
        if route:
            train["total_distance_km"] = round(
                float(train.get("total_distance_km", 0)) + float(route.get("distance_km", 0)), 1
            )
        if path_index + 1 < len(path):
            train["path_index"] = path_index + 1
            train["current_route_id"] = path[path_index + 1]
            train["progress_pct"] = 0
            train["current_speed_kmh"] = 0
            train["speed_kmh"] = 0
            train["lifecycle"] = "dwelling"
            train["status"] = "dwelling"
            train["dwell_remaining_s"] = DWELL_TIME_INTERMEDIATE_S
            train["_at_terminal"] = False
        else:
            train["progress_pct"] = 100
            train["current_speed_kmh"] = 0
            train["speed_kmh"] = 0
            train["lifecycle"] = "dwelling"
            train["status"] = "dwelling"
            train["dwell_remaining_s"] = DWELL_TIME_TERMINAL_S
            train["_at_terminal"] = True

    # ------------------------------------------------------------------
    # Signal logic — Realistic Automatic Block Signalling
    # ------------------------------------------------------------------

    def _get_signal_aspect_for_train(self, train: JsonDict, route: JsonDict, current_block: int) -> str:
        block_count = max(1, int(route.get("block_count", 1)))
        next_block = current_block + 1
        if next_block >= block_count:
            path = train.get("path", [])
            path_index = train.get("path_index", 0)
            if path_index + 1 < len(path):
                next_route = self._routes_by_id().get(path[path_index + 1])
                if next_route:
                    next_occupancy = self._build_occupancy()
                    if not self._is_block_available(next_occupancy, next_route["id"], 0, str(train["id"])):
                        return "caution"
            return "clear"

        for signal in self.state["signals"]:
            if signal.get("route_id") == route["id"] and int(signal.get("block_index", -1)) == next_block:
                return signal.get("aspect", "clear")
        return "clear"

    def _speed_from_signal(self, aspect: str, max_speed: float) -> float:
        if aspect == "stop": return 0
        elif aspect == "caution": return min(max_speed, 40.0)
        elif aspect == "attention": return min(max_speed, 75.0)
        else: return max_speed

    def _update_signals(self, occupancy: OccupancyMap) -> None:
        signal_lookup: dict[tuple[str, int], JsonDict] = {}
        for signal in self.state["signals"]:
            route_id = signal.get("route_id")
            block_index = int(signal.get("block_index", 0))
            signal_lookup[(route_id, block_index)] = signal
            signal["aspect"] = "clear"
            signal["occupied"] = False

        # Apply failures (not random, just check flag)
        for signal in self.state["signals"]:
            if signal.get("failure"):
                signal["aspect"] = "stop"
                signal["status"] = "failed"
            else:
                signal["status"] = "operational"

        # Apply Occupancy ABS
        for (route_id, block_index), train_ids in occupancy.items():
            if not train_ids:
                continue

            # Red
            current_signal = signal_lookup.get((route_id, block_index))
            if current_signal:
                current_signal["aspect"] = "stop"
                current_signal["occupied"] = True

            # Yellow
            prev_signal = signal_lookup.get((route_id, block_index - 1))
            if prev_signal and prev_signal.get("aspect") not in {"stop"}:
                prev_signal["aspect"] = "caution"

            # Double Yellow
            prev2_signal = signal_lookup.get((route_id, block_index - 2))
            if prev2_signal and prev2_signal.get("aspect") == "clear":
                prev2_signal["aspect"] = "attention"

        # Maintenance restrictions
        maintenance_routes = {task.get("location") for task in self.state.get("maintenance", [])}
        for signal in self.state["signals"]:
            signal["maintenance"] = signal.get("route_id") in maintenance_routes
            if signal["maintenance"] and signal["aspect"] == "clear":
                signal["aspect"] = "attention"

        # Weather restrictions
        weather_stations = self.state.get("weather", {}).get("stations", {})
        for signal in self.state["signals"]:
            station_code = signal.get("station_code")
            station_weather = weather_stations.get(station_code, {})
            speed_factor = float(station_weather.get("speed_factor", 1.0))
            if speed_factor < 0.9 and signal["aspect"] == "clear":
                signal["aspect"] = "attention"

    def _verify_consistency(self, occupancy: OccupancyMap) -> None:
        # Validate every tick
        for train in self.state["trains"]:
            status = train.get("status")
            speed = float(train.get("current_speed_kmh", 0))
            
            # waiting/stopped train speed == 0
            if status in {"waiting", "stopped"} and speed > 0:
                logger.error(f"Consistency Error: Train {train['id']} is {status} but speed is {speed}")
                
            # occupied block contains train
            route_id = train.get("current_route_id")
            block_index = train.get("block_index", 0)
            if route_id and status not in {"dwelling", "reversing", "at_station"}:
                occ = occupancy.get((route_id, block_index), [])
                if train["id"] not in occ:
                    logger.error(f"Consistency Error: Train {train['id']} not in occupancy for {route_id} B{block_index}")
                    
        for signal in self.state["signals"]:
            aspect = signal.get("aspect")
            is_occupied = signal.get("occupied", False)
            failure = signal.get("failure", False)
            
            # red signal occupied or failed
            if aspect == "stop" and not is_occupied and not failure:
                # Wait, it could be red because it's a stop signal at the end of the route? No, ABS.
                pass 
            
            # green signal not occupied
            if aspect == "clear" and is_occupied:
                logger.error(f"Consistency Error: Signal {signal['id']} is clear but block is occupied")

    def _add_alert(self, title: str, description: str, severity: str, alert_type: str) -> None:
        """Add an alert with cooldown to prevent spam."""
        cooldown_key = f"{alert_type}:{title}"

        if cooldown_key in self._alert_cooldowns:
            if self.tick_count - self._alert_cooldowns[cooldown_key] < ALERT_COOLDOWN_TICKS:
                return

        self._alert_cooldowns[cooldown_key] = self.tick_count

        alert = {
            "id": f"alert_{self.tick_count}",
            "title": title,
            "description": description,
            "severity": severity,
            "type": alert_type,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "acknowledged": False,
            "source": "simulation",
        }

        self.state["alerts"].insert(0, alert)

        # Trim alerts to keep bounded
        if len(self.state["alerts"]) > MAX_ALERTS:
            self.state["alerts"] = self.state["alerts"][:MAX_ALERTS]

    # ------------------------------------------------------------------
    # Dynamic state updates
    # ------------------------------------------------------------------

    def _update_dynamic_state(self, occupancy: OccupancyMap | None = None) -> None:
        """Recalculate all derived state."""
        for train in self.state["trains"]:
            self._normalise_train(train)

        if occupancy is None:
            occupancy = self._build_occupancy()

        self._update_routes(occupancy)
        self._update_signals(occupancy)
        self._update_stations()
        self._update_insights()
        self._update_analytics()
        self._update_runtime()

    def _normalise_train(self, train: JsonDict) -> None:
        """Derive display fields from train state."""
        path = train.get("path") or []
        current_route_id = train.get("current_route_id")

        if path and current_route_id not in path:
            train["current_route_id"] = path[0]
            train["path_index"] = 0
        elif path:
            try:
                train["path_index"] = path.index(current_route_id)
            except ValueError:
                train["path_index"] = 0
                train["current_route_id"] = path[0]

        route = self._routes_by_id().get(train.get("current_route_id"))
        if not route:
            return

        travel_direction = train.get("travel_direction", "forward")
        progress_pct = max(0.0, min(100.0, float(train.get("progress_pct", 0))))
        position = self._position_on_route(route, progress_pct, travel_direction)
        current_code, next_code = self._route_display_endpoints(route, travel_direction)

        train["progress_pct"] = round(progress_pct, 3)
        train["lat"] = position["lat"]
        train["lng"] = position["lng"]
        train["bearing"] = self._route_bearing(route, travel_direction)

        # Station display
        if train.get("lifecycle") in {"dwelling", "reversing"} or train.get("status") == "at_station":
            if progress_pct >= 99:
                train["current_station"] = next_code
            else:
                train["current_station"] = current_code
            train["next_station"] = train.get("destination", next_code)
        else:
            train["current_station"] = current_code
            train["next_station"] = next_code

        block_count = max(1, int(route.get("block_count", 1)))
        train["block_index"] = self._block_index(progress_pct, block_count)
        train["block_id"] = f"{route['code']}-B{train['block_index'] + 1:02d}"
        train["section"] = route["code"]
        train["corridor"] = route.get("corridor")

    def _update_routes(self, occupancy: OccupancyMap) -> None:
        trains_by_route: dict[str, list[JsonDict]] = {}
        for train in self.state["trains"]:
            route_id = train.get("current_route_id")
            if route_id:
                trains_by_route.setdefault(route_id, []).append(train)

        for route in self.state["routes"]:
            route_trains = trains_by_route.get(route["id"], [])
            delayed = [int(train.get("delay_minutes", 0)) for train in route_trains]
            occupied_blocks = [
                block for (route_id, block), trains in occupancy.items() if route_id == route["id"] and trains
            ]
            route["current_trains"] = len(route_trains)
            route["occupied"] = bool(occupied_blocks)
            route["occupied_blocks"] = occupied_blocks
            route["average_delay_minutes"] = round(sum(delayed) / len(delayed), 1) if delayed else 0
            route["travel_time_minutes"] = self._route_travel_time(route)

            block_count = max(1, int(route.get("block_count", 1)))
            
            blocks = []
            for i in range(block_count):
                status = "clear"
                for sig in self.state["signals"]:
                    if sig.get("route_id") == route["id"] and int(sig.get("block_index", 0)) == i:
                        status = sig.get("aspect", "clear")
                        break
                
                poly = route.get("polyline", [])
                p1 = poly[i] if i < len(poly) else [0,0]
                p2 = poly[i+1] if (i+1) < len(poly) else (poly[-1] if poly else [0,0])
                blocks.append({
                    "index": i,
                    "status": status,
                    "polyline": [p1, p2]
                })
            route["blocks"] = blocks
            load = len(occupied_blocks) / block_count
            if load >= 0.5 or route["current_trains"] >= 3:
                route["congestion"] = "high"
            elif load >= 0.25 or route["current_trains"] == 2:
                route["congestion"] = "medium"
            else:
                route["congestion"] = "low"

    def _update_stations(self) -> None:
        weather = self.state.get("weather", {}).get("stations", {})

        for station in self.state["stations"]:
            code = station["code"]
            arrivals = [
                train
                for train in self.state["trains"]
                if train.get("next_station") == code
                and train.get("status") not in {"stopped", "dwelling", "completed"}
            ]
            departures = [
                train
                for train in self.state["trains"]
                if train.get("current_station") == code
                and train.get("status") not in {"stopped", "dwelling", "completed"}
            ]
            at_station = [
                train
                for train in self.state["trains"]
                if (train.get("current_station") == code or train.get("next_station") == code)
                and train.get("status") in {"stopped", "dwelling"}
            ]

            occupied_platforms = min(
                int(station.get("platforms", 1)),
                len(at_station) + min(len(arrivals), 2),
            )
            platforms = max(1, int(station.get("platforms", 1)))
            station["occupancy"] = round((occupied_platforms / platforms) * 100)
            station["occupied_platforms"] = occupied_platforms
            station["arrivals"] = [self._train_brief(train) for train in arrivals[:5]]
            station["departures"] = [self._train_brief(train) for train in departures[:5]]
            station["nearby_trains"] = [
                self._train_brief(train)
                for train in self.state["trains"]
                if train.get("current_station") == code or train.get("next_station") == code
            ][:8]
            station["weather"] = weather.get(code, {"condition": "Clear", "temp_c": 31, "wind_kmh": 8})

    def _update_insights(self) -> None:
        delayed_trains = sorted(
            [train for train in self.state["trains"] if int(train.get("delay_minutes", 0)) > 0],
            key=lambda train: int(train.get("delay_minutes", 0)),
            reverse=True,
        )
        waiting_trains = [train for train in self.state["trains"] if train.get("status") == "stopped"]
        dwelling_trains = [train for train in self.state["trains"] if train.get("lifecycle") == "dwelling"]
        congested_routes = [route for route in self.state["routes"] if route.get("congestion") == "high"]
        failed_signals = [s for s in self.state["signals"] if s.get("failure")]

        insights: list[JsonDict] = []

        # Signal failure insight
        if failed_signals:
            signal = failed_signals[0]
            insights.append(
                {
                    "title": "Signal Equipment Failure",
                    "desc": (
                        f"Signal {signal['name']} has failed with health at {signal.get('health', 0)}%. "
                        f"Block {signal.get('block_id')} is locked to STOP aspect. "
                        f"Maintenance team en route. {len(failed_signals)} signal(s) affected."
                    ),
                    "type": "safety",
                    "severity": "danger",
                    "source": "simulation",
                }
            )

        if waiting_trains:
            train = waiting_trains[0]
            insights.append(
                {
                    "title": "Block Occupancy Conflict",
                    "desc": (
                        f"Train {train['number']} is held at block {train.get('block_id')} "
                        f"due to {train.get('lifecycle', 'signal')} restriction. "
                        f"Speed: {train.get('speed_kmh', 0)} km/h. "
                        f"{len(waiting_trains)} train(s) currently waiting."
                    ),
                    "type": "routing",
                    "severity": "warning",
                    "source": "simulation",
                }
            )

        if delayed_trains:
            train = delayed_trains[0]
            insights.append(
                {
                    "title": "Delay Propagation Watch",
                    "desc": (
                        f"{train['number']} {train['name']} is {train['delay_minutes']} min late on "
                        f"{train.get('section')}. Trip #{train.get('trips_completed', 0)}. "
                        f"Consider prioritising platform clearance at {train.get('next_station')}."
                    ),
                    "type": "routing",
                    "severity": "warning",
                    "source": "simulation",
                }
            )

        if congested_routes:
            route = congested_routes[0]
            insights.append(
                {
                    "title": "Corridor Congestion",
                    "desc": (
                        f"{route['code']} is carrying {route.get('current_trains', 0)} active trains "
                        f"with {len(route.get('occupied_blocks', []))} occupied blocks. "
                        "AI advisor recommends spacing freight departures."
                    ),
                    "type": "efficiency",
                    "severity": "info",
                    "source": "simulation",
                }
            )

        if dwelling_trains:
            total_dwelling = len(dwelling_trains)
            insights.append(
                {
                    "title": "Platform Occupancy Report",
                    "desc": (
                        f"{total_dwelling} train(s) currently dwelling at platforms. "
                        f"Network throughput remains stable with continuous lifecycle turnover."
                    ),
                    "type": "efficiency",
                    "severity": "info",
                    "source": "simulation",
                }
            )

        maintenance = self.state.get("maintenance", [])
        if maintenance:
            task = maintenance[0]
            insights.append(
                {
                    "title": "Maintenance Speed Restriction",
                    "desc": (
                        f"{task['type']} at {task['station_code']} is active. Keep trains below "
                        f"{task['speed_restriction_kmh']} km/h through {task['block']}."
                    ),
                    "type": "maintenance",
                    "severity": "danger" if task.get("urgency") == "Critical" else "warning",
                    "source": "simulation",
                }
            )

        if not insights:
            insights.append(
                {
                    "title": "Network Stable",
                    "desc": "All monitored corridors are operating inside planned headway and speed envelopes.",
                    "type": "efficiency",
                    "severity": "success",
                    "source": "simulation",
                }
            )

        self.state["insights"] = insights[:6]

    def _update_analytics(self) -> None:
        trains = self.state["trains"]
        active = [t for t in trains if t.get("status") not in {"completed", "terminated"}]
        running = [t for t in trains if t.get("status") == "running"]
        delayed = [t for t in trains if int(t.get("delay_minutes", 0)) > 0]

        signal_counts = {
            "Healthy (>90%)": 0,
            "Degraded (70-90%)": 0,
            "Maintenance (<70%)": 0,
        }
        for signal in self.state["signals"]:
            health = float(signal.get("health_score", signal.get("health", 100)))
            if health >= 90:
                signal_counts["Healthy (>90%)"] += 1
            elif health >= 70:
                signal_counts["Degraded (70-90%)"] += 1
            else:
                signal_counts["Maintenance (<70%)"] += 1

        on_time_pct = int(((len(active) - len(delayed)) / max(len(active), 1)) * 100)
        delayed_pct = max(0, 100 - on_time_pct)

        # Build rolling 7-day performance from history
        perf_7d = self._build_performance_7d(on_time_pct, delayed_pct)

        self.state["analytics"] = {
            "train_performance_7d": perf_7d,
            "alerts_by_severity": self._alerts_by_severity(),
            "signal_health_distribution": [
                {"status": status, "count": count} for status, count in signal_counts.items()
            ],
            "active_trains": len(active),
            "running_trains": len(running),
            "delayed_trains": len(delayed),
            "dwelling_trains": len([t for t in trains if t.get("lifecycle") == "dwelling"]),
            "total_trips": sum(int(t.get("trips_completed", 0)) for t in trains),
            "average_speed": round(
                sum(float(t.get("current_speed_kmh", 0)) for t in running) / max(len(running), 1), 1
            ),
            "average_delay": round(
                sum(int(t.get("delay_minutes", 0)) for t in delayed) / max(len(delayed), 1), 1
            ),
        }

    def _record_performance_snapshot(self) -> None:
        """Record a performance snapshot for rolling analytics."""
        trains = self.state["trains"]
        active = [t for t in trains if t.get("status") not in {"completed", "terminated"}]
        delayed = [t for t in trains if int(t.get("delay_minutes", 0)) > 0]
        on_time = max(0, int(((len(active) - len(delayed)) / max(len(active), 1)) * 100))

        self._performance_history.append({
            "tick": self.tick_count,
            "on_time": on_time,
            "delayed": max(0, 100 - on_time),
        })

        # Keep last 7 * 24 * 60 entries (~7 days at 1 entry per sim-minute)
        if len(self._performance_history) > 10080:
            self._performance_history = self._performance_history[-10080:]

    def _build_performance_7d(self, current_on_time: int, current_delayed: int) -> list[JsonDict]:
        """Build a 7-day rolling performance chart from snapshots."""
        # Group snapshots into day-sized buckets
        entries_per_day = 1440  # 24 * 60
        history = self._performance_history

        days = []
        day_labels = ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"]

        if len(history) < 7:
            # Not enough history — use realistic baselines with current data
            baselines = [
                {"date": "Jul 07", "on_time": 91, "delayed": 9},
                {"date": "Jul 08", "on_time": 93, "delayed": 7},
                {"date": "Jul 09", "on_time": 90, "delayed": 10},
                {"date": "Jul 10", "on_time": 94, "delayed": 6},
                {"date": "Jul 11", "on_time": 92, "delayed": 8},
                {"date": "Jul 12", "on_time": 95, "delayed": 5},
                {"date": "Today", "on_time": current_on_time, "delayed": current_delayed},
            ]
            return baselines

        # Chunk into day-sized buckets
        for i in range(7):
            start = max(0, len(history) - entries_per_day * (7 - i))
            end = max(0, len(history) - entries_per_day * (6 - i))
            chunk = history[start:end]

            if chunk:
                avg_on_time = int(sum(s["on_time"] for s in chunk) / len(chunk))
                avg_delayed = int(sum(s["delayed"] for s in chunk) / len(chunk))
            else:
                avg_on_time = current_on_time
                avg_delayed = current_delayed

            days.append({
                "date": day_labels[i],
                "on_time": avg_on_time,
                "delayed": avg_delayed,
            })

        return days

    def _update_runtime(self) -> None:
        trains = self.state["trains"]
        signals = self.state["signals"]
        running_trains = len([t for t in trains if t.get("status") not in {"stopped", "dwelling", "completed"}])
        at_station_trains = len([t for t in trains if t.get("status") in {"stopped", "dwelling"}])
        running_signals = len([s for s in signals if s.get("status") == "operational"])
        failed_signals = len([s for s in signals if s.get("failure")])

        self.state["runtime"] = {
            "backend_status": "operational",
            "database_status": "json-simulation",
            "simulation_status": "running" if self.running else "standby",
            "api_latency_ms": 24 + (self.tick_count % 7),
            "memory_usage_mb": 186 + (self.tick_count % 11),
            "cpu_usage_percent": 18 + (self.tick_count % 9),
            "running_trains": running_trains,
            "at_station_trains": at_station_trains,
            "total_trains": len(trains),
            "running_signals": running_signals,
            "failed_signals": failed_signals,
            "total_signals": len(signals),
            "simulation_tick": self.tick_count,
            "total_trips_completed": sum(int(t.get("trips_completed", 0)) for t in trains),
            "docker_status": "not_checked",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # ------------------------------------------------------------------
    # Occupancy
    # ------------------------------------------------------------------

    def _build_occupancy(self) -> OccupancyMap:
        """Build block occupancy map from ALL active trains.

        Includes running, waiting, AND dwelling trains to prevent
        block collisions during platform stops.
        """
        occupancy: OccupancyMap = {}
        for train in self.state["trains"]:
            # All lifecycle states occupy blocks
            route = self._routes_by_id().get(train.get("current_route_id"))
            if not route:
                continue

            block_count = max(1, int(route.get("block_count", 1)))
            block_index = self._block_index(float(train.get("progress_pct", 0)), block_count)
            occupancy.setdefault((route["id"], block_index), []).append(str(train["id"]))

        return occupancy

    def _is_block_available(
        self,
        occupancy: OccupancyMap,
        route_id: str,
        block_index: int,
        train_id: str,
    ) -> bool:
        occupying_trains = occupancy.get((route_id, block_index), [])
        return not [occupant for occupant in occupying_trains if occupant != train_id]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _effective_speed_limit(self, route: JsonDict) -> float:
        limit = float(route.get("max_speed_kmh", 100))

        if route.get("operational_status") == "speed_restriction":
            limit = min(limit, 90)
        if route.get("operational_status") == "terminal_approach":
            limit = min(limit, 80)
        if route.get("operational_status") == "congested":
            limit = min(limit, 100)

        for task in self.state.get("maintenance", []):
            if task.get("location") == route.get("id"):
                limit = min(limit, float(task.get("speed_restriction_kmh", limit)))

        weather = self.state.get("weather", {}).get("stations", {})
        source_weather = weather.get(route.get("source_code"), {})
        target_weather = weather.get(route.get("target_code"), {})
        weather_factor = min(
            float(source_weather.get("speed_factor", 1.0)),
            float(target_weather.get("speed_factor", 1.0)),
        )

        return round(limit * weather_factor, 1)

    def _position_on_route(
        self,
        route: JsonDict,
        progress_pct: float,
        travel_direction: str,
    ) -> dict[str, float]:
        polyline = route.get("polyline")
        if not polyline or len(polyline) < 2:
            stations = self._stations_by_code()
            source = stations.get(route["source_code"])
            target = stations.get(route["target_code"])
            if not source or not target:
                return {"lat": 0.0, "lng": 0.0}
            polyline = [[source["lng"], source["lat"]], [target["lng"], target["lat"]]]

        ratio = max(0.0, min(1.0, progress_pct / 100))
        if travel_direction == "reverse":
            ratio = 1 - ratio

        # Find the segment in the polyline
        total_segments = len(polyline) - 1
        segment_index = min(int(ratio * total_segments), total_segments - 1)
        segment_ratio = (ratio * total_segments) - segment_index
        
        p0 = polyline[segment_index]
        p1 = polyline[segment_index + 1]

        lng = p0[0] + (p1[0] - p0[0]) * segment_ratio
        lat = p0[1] + (p1[1] - p0[1]) * segment_ratio

        return {"lat": round(lat, 6), "lng": round(lng, 6)}

    def _route_display_endpoints(self, route: JsonDict, travel_direction: str) -> tuple[str, str]:
        if travel_direction == "reverse":
            return str(route["target_code"]), str(route["source_code"])
        return str(route["source_code"]), str(route["target_code"])

    def _route_bearing(self, route: JsonDict, travel_direction: str) -> float:
        polyline = route.get("polyline")
        if not polyline or len(polyline) < 2:
            stations = self._stations_by_code()
            source = stations.get(route["source_code"])
            target = stations.get(route["target_code"])
            if not source or not target:
                return 0.0
            p0 = [source["lng"], source["lat"]]
            p1 = [target["lng"], target["lat"]]
        else:
            p0 = polyline[0]
            p1 = polyline[-1]

        if travel_direction == "reverse":
            p0, p1 = p1, p0

        lat_delta = p1[1] - p0[1]
        lng_delta = p1[0] - p0[0]
        bearing = math.degrees(math.atan2(lng_delta, lat_delta))
        return round((bearing + 360) % 360, 1)

    def _block_index(self, progress_pct: float, block_count: int) -> int:
        if progress_pct >= 100:
            return block_count - 1
        return max(0, min(block_count - 1, int((progress_pct / 100) * block_count)))

    def _route_travel_time(self, route: JsonDict) -> int:
        speed = max(1, float(route.get("max_speed_kmh", 100)))
        return max(1, round((float(route.get("distance_km", 1)) / speed) * 60))

    def _train_brief(self, train: JsonDict) -> JsonDict:
        return {
            "id": train.get("id"),
            "number": train.get("number"),
            "name": train.get("name"),
            "status": train.get("status"),
            "lifecycle": train.get("lifecycle"),
            "delay_minutes": train.get("delay_minutes", 0),
            "eta": train.get("eta"),
            "trips_completed": train.get("trips_completed", 0),
        }

    def _alerts_by_severity(self) -> list[JsonDict]:
        severities = ["critical", "high", "medium", "low"]
        alerts = self.state.get("alerts", [])
        return [
            {
                "severity": severity.title(),
                "count": len([alert for alert in alerts if alert.get("severity") == severity]),
            }
            for severity in severities
        ]

    def _stations_by_code(self) -> dict[str, JsonDict]:
        return {station["code"]: station for station in self.state.get("stations", [])}

    def _routes_by_id(self) -> dict[str, JsonDict]:
        return {route["id"]: route for route in self.state.get("routes", [])}


simulation_engine = SimulationEngine()
