import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.utils.logger import get_logger

logger = get_logger(__name__)

MOCK_DATA_DIR = Path(__file__).parent.parent / "mock_data"

JsonDict = dict[str, Any]
OccupancyMap = dict[tuple[str, int], list[str]]


class SimulationEngine:
    """Backend source of truth for the educational railway simulation.

    The engine keeps railway topology in JSON-backed state, then derives
    GPS positions, signal aspects, block occupancy, station occupancy, and
    advisory insights on every tick.
    """

    def __init__(self) -> None:
        self.running = False
        self.tick_count = 0
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

    def _normalise_static_state(self) -> None:
        """Derive static geometry and missing signal records from topology."""
        stations = self._stations_by_code()

        for route in self.state["routes"]:
            source = stations.get(route.get("source_code"))
            target = stations.get(route.get("target_code"))
            if not source or not target:
                continue

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
                        "health_score": 100,
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

    def _tick(self) -> None:
        """Perform one deterministic simulation step."""
        self.tick_count += 1

        config = self.state["config"]
        tick_duration_s = config.get("tick_rate_ms", 1000) / 1000.0
        sim_seconds = tick_duration_s * config.get("simulation_speed_multiplier", 60)
        delay_increment = int(config.get("delay_increment_minutes", 1))

        occupancy = self._build_occupancy()

        for train in self.state["trains"]:
            if train.get("status") not in {"running", "waiting"}:
                self._normalise_train(train)
                continue

            route = self._routes_by_id().get(train.get("current_route_id"))
            if not route:
                continue

            block_count = max(1, int(route.get("block_count", 1)))
            current_progress = float(train.get("progress_pct", 0))
            current_block = self._block_index(current_progress, block_count)
            speed_limit = self._effective_speed_limit(route)
            target_speed = min(float(train.get("max_speed_kmh", speed_limit)), speed_limit)
            distance_moved = target_speed * (sim_seconds / 3600.0)
            pct_moved = (distance_moved / max(float(route.get("distance_km", 1)), 1)) * 100
            target_progress = min(100.0, current_progress + pct_moved)
            target_block = self._block_index(target_progress, block_count)

            if target_block != current_block and not self._is_block_available(
                occupancy,
                str(route["id"]),
                target_block,
                str(train["id"]),
            ):
                train["status"] = "waiting"
                # Braking
                current_speed = float(train.get("current_speed_kmh", 0))
                train["current_speed_kmh"] = max(0, current_speed - 20 * (sim_seconds / 60))
                train["speed_kmh"] = round(train["current_speed_kmh"], 1)
                train["delay_minutes"] = int(train.get("delay_minutes", 0)) + delay_increment
                self._normalise_train(train)
                continue

            # Check station dwell time
            if train.get("dwell_remaining_s", 0) > 0:
                train["status"] = "at_station"
                train["current_speed_kmh"] = 0
                train["speed_kmh"] = 0
                train["dwell_remaining_s"] -= sim_seconds
                self._normalise_train(train)
                continue

            train["status"] = "running"
            
            # Acceleration / Braking simulation
            current_speed = float(train.get("current_speed_kmh", 0))
            if current_speed < target_speed:
                # Acceleration curve
                new_speed = min(target_speed, current_speed + 15 * (sim_seconds / 60))
            elif current_speed > target_speed:
                # Braking curve
                new_speed = max(target_speed, current_speed - 20 * (sim_seconds / 60))
            else:
                new_speed = target_speed
                
            train["current_speed_kmh"] = round(new_speed, 1)
            train["speed_kmh"] = round(new_speed, 1)
            
            distance_moved = new_speed * (sim_seconds / 3600.0)
            pct_moved = (distance_moved / max(float(route.get("distance_km", 1)), 1)) * 100
            target_progress = min(100.0, current_progress + pct_moved)
            
            train["progress_pct"] = round(target_progress, 3)

            if train["progress_pct"] >= 100:
                self._advance_train(train)

            self._normalise_train(train)

        self._update_dynamic_state()

    def _advance_train(self, train: JsonDict) -> None:
        path = train.get("path") or []
        current_route_id = train.get("current_route_id")
        try:
            path_index = path.index(current_route_id)
        except ValueError:
            path_index = int(train.get("path_index", 0))

        if path_index + 1 < len(path):
            train["path_index"] = path_index + 1
            train["current_route_id"] = path[path_index + 1]
            train["progress_pct"] = 0
            train["status"] = "at_station" # Dwell at intermediate station
            train["dwell_remaining_s"] = 120 # 2 minute dwell
            return

        train["status"] = "at_station"
        train["current_speed_kmh"] = 0
        train["speed_kmh"] = 0
        train["progress_pct"] = 100
        train["current_station"] = train.get("destination")
        train["next_station"] = train.get("destination")

    def _update_dynamic_state(self) -> None:
        for train in self.state["trains"]:
            self._normalise_train(train)

        occupancy = self._build_occupancy()
        self._update_routes(occupancy)
        self._update_signals(occupancy)
        self._update_stations()
        self._update_insights()
        self._update_analytics()
        self._update_runtime()

    def _normalise_train(self, train: JsonDict) -> None:
        path = train.get("path") or []
        if path and train.get("current_route_id") not in path:
            train["current_route_id"] = path[0]
            train["path_index"] = 0
        elif path:
            train["path_index"] = path.index(train["current_route_id"])

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
        train["current_station"] = current_code if train.get("status") != "at_station" else train.get("destination")
        train["next_station"] = next_code if train.get("status") != "at_station" else train.get("destination")
        train["block_index"] = self._block_index(progress_pct, int(route.get("block_count", 1)))
        train["block_id"] = f"{route['code']}-B{train['block_index'] + 1:02d}"
        train["section"] = route["code"]
        train["corridor"] = route.get("corridor")
        train["speed_kmh"] = train.get("current_speed_kmh", 0)

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
            load = len(occupied_blocks) / block_count
            if load >= 0.5 or route["current_trains"] >= 3:
                route["congestion"] = "high"
            elif load >= 0.25 or route["current_trains"] == 2:
                route["congestion"] = "medium"
            else:
                route["congestion"] = "low"

    def _update_signals(self, occupancy: OccupancyMap) -> None:
        signal_lookup: dict[tuple[str, int], JsonDict] = {}

        for signal in self.state["signals"]:
            route_id = signal.get("route_id")
            block_index = int(signal.get("block_index", 0))
            signal_lookup[(route_id, block_index)] = signal
            signal["aspect"] = "clear"
            signal["occupied"] = False
            signal["failure"] = signal.get("health_score", signal.get("health", 100)) < 50
            signal["status"] = "failed" if signal["failure"] else "operational"

        for (route_id, block_index), train_ids in occupancy.items():
            if not train_ids:
                continue

            current = signal_lookup.get((route_id, block_index))
            if current:
                current["aspect"] = "stop"
                current["occupied"] = True

            previous = signal_lookup.get((route_id, block_index - 1))
            if previous and previous.get("aspect") != "stop":
                previous["aspect"] = "caution"

            approach = signal_lookup.get((route_id, block_index - 2))
            if approach and approach.get("aspect") == "clear":
                approach["aspect"] = "attention"

        maintenance_routes = {task.get("location") for task in self.state.get("maintenance", [])}
        for signal in self.state["signals"]:
            signal["maintenance"] = signal.get("route_id") in maintenance_routes
            if signal["maintenance"] and signal["aspect"] == "clear":
                signal["aspect"] = "attention"

    def _update_stations(self) -> None:
        weather = self.state.get("weather", {}).get("stations", {})

        for station in self.state["stations"]:
            code = station["code"]
            arrivals = [
                train
                for train in self.state["trains"]
                if train.get("next_station") == code and train.get("status") in {"running", "waiting"}
            ]
            departures = [
                train
                for train in self.state["trains"]
                if train.get("current_station") == code and train.get("status") in {"running", "waiting"}
            ]
            at_station = [
                train
                for train in self.state["trains"]
                if train.get("current_station") == code and train.get("status") == "at_station"
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
        waiting_trains = [train for train in self.state["trains"] if train.get("status") == "waiting"]
        congested_routes = [route for route in self.state["routes"] if route.get("congestion") == "high"]

        insights: list[JsonDict] = []

        if waiting_trains:
            train = waiting_trains[0]
            insights.append(
                {
                    "title": "Block Occupancy Conflict",
                    "desc": (
                        f"Train {train['number']} is waiting at block {train.get('block_id')} "
                        "because the next block is occupied. Holding movement protects headway."
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
                        f"{train.get('section')}. Consider prioritising platform clearance at "
                        f"{train.get('next_station')}."
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
                        "with multiple occupied blocks. AI advisor recommends spacing freight departures."
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
        active = [train for train in trains if train.get("status") in {"running", "waiting"}]
        delayed = [train for train in trains if int(train.get("delay_minutes", 0)) > 0]
        signal_counts = {
            "Healthy (>90%)": 0,
            "Degraded (70-90%)": 0,
            "Maintenance (<70%)": 0,
        }
        for signal in self.state["signals"]:
            health = int(signal.get("health_score", signal.get("health", 100)))
            if health >= 90:
                signal_counts["Healthy (>90%)"] += 1
            elif health >= 70:
                signal_counts["Degraded (70-90%)"] += 1
            else:
                signal_counts["Maintenance (<70%)"] += 1

        on_time_pct = int(((len(active) - len(delayed)) / len(active)) * 100) if active else 100
        delayed_pct = max(0, 100 - on_time_pct)

        self.state["analytics"] = {
            "train_performance_7d": [
                {"date": "Jul 02", "on_time": 91, "delayed": 9},
                {"date": "Jul 03", "on_time": 93, "delayed": 7},
                {"date": "Jul 04", "on_time": 90, "delayed": 10},
                {"date": "Jul 05", "on_time": 94, "delayed": 6},
                {"date": "Jul 06", "on_time": 92, "delayed": 8},
                {"date": "Jul 07", "on_time": 95, "delayed": 5},
                {"date": "Today", "on_time": on_time_pct, "delayed": delayed_pct},
            ],
            "alerts_by_severity": self._alerts_by_severity(),
            "signal_health_distribution": [
                {"status": status, "count": count} for status, count in signal_counts.items()
            ],
        }

    def _update_runtime(self) -> None:
        trains = self.state["trains"]
        signals = self.state["signals"]
        running_trains = len([train for train in trains if train.get("status") in {"running", "waiting"}])
        running_signals = len([signal for signal in signals if signal.get("status") == "operational"])

        self.state["runtime"] = {
            "backend_status": "operational",
            "database_status": "json-simulation",
            "simulation_status": "running" if self.running else "standby",
            "api_latency_ms": 24 + (self.tick_count % 7),
            "memory_usage_mb": 186 + (self.tick_count % 11),
            "cpu_usage_percent": 18 + (self.tick_count % 9),
            "running_trains": running_trains,
            "running_signals": running_signals,
            "simulation_tick": self.tick_count,
            "docker_status": "not_checked",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def _build_occupancy(self) -> OccupancyMap:
        occupancy: OccupancyMap = {}
        for train in self.state["trains"]:
            if train.get("status") not in {"running", "waiting"}:
                continue

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
        stations = self._stations_by_code()
        source = stations[route["source_code"]]
        target = stations[route["target_code"]]
        ratio = max(0.0, min(1.0, progress_pct / 100))
        if travel_direction == "reverse":
            ratio = 1 - ratio

        return {
            "lat": round(source["lat"] + (target["lat"] - source["lat"]) * ratio, 6),
            "lng": round(source["lng"] + (target["lng"] - source["lng"]) * ratio, 6),
        }

    def _route_display_endpoints(self, route: JsonDict, travel_direction: str) -> tuple[str, str]:
        if travel_direction == "reverse":
            return str(route["target_code"]), str(route["source_code"])
        return str(route["source_code"]), str(route["target_code"])

    def _route_bearing(self, route: JsonDict, travel_direction: str) -> float:
        stations = self._stations_by_code()
        source = stations[route["source_code"]]
        target = stations[route["target_code"]]
        if travel_direction == "reverse":
            source, target = target, source

        lat_delta = target["lat"] - source["lat"]
        lng_delta = target["lng"] - source["lng"]
        # This planar bearing is sufficient for short corridor segments in the map UI.
        import math

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
            "delay_minutes": train.get("delay_minutes", 0),
            "eta": train.get("eta"),
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
