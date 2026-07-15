from typing import List, Optional, Any, Tuple
from pydantic import BaseModel, Field

class Train(BaseModel):
    id: str
    number: str
    name: str = "Unknown Train"
    type: str = "default"
    category: str = "default"
    priority: Any = "medium"
    icon_type: str = "default"
    status: str = "running"
    lifecycle: str = "running"
    origin: str = "UNKNOWN"
    destination: str = "UNKNOWN"
    current_station: str = "UNKNOWN"
    next_station: str = "UNKNOWN"
    current_route_id: str = ""
    current_speed_kmh: float = 0.0
    delay_minutes: int = 0
    progress_pct: float = 0.0
    bearing: float = 0.0
    lat: float = 0.0
    lng: float = 0.0
    trips_completed: int = 0
    block_index: int = 0
    block_id: str = ""
    section: str = ""
    corridor: str = ""
    division: str = "Secunderabad"

class Block(BaseModel):
    index: int
    status: str = "clear"
    polyline: List[List[float]] = []

class Route(BaseModel):
    id: str
    name: str = "Unknown Route"
    code: str = "UNKNOWN"
    source_code: str = ""
    target_code: str = ""
    corridor: str = "Branch"
    line_type: str = "single"
    electrified: bool = True
    distance_km: float = 0.0
    stations_count: int = 0
    max_speed_kmh: float = 100.0
    congestion: str = "low"
    current_trains: int = 0
    polyline: List[List[float]] = []
    blocks: List[Block] = []

class Station(BaseModel):
    id: str
    name: str
    code: str
    lat: float = 0.0
    lng: float = 0.0
    platforms: int = 1
    zone: str = "SCR"
    division: str = "Secunderabad"
    status: str = "operational"
    occupancy: int = 0
    arrivals: List[Any] = []
    departures: List[Any] = []
    nearby_trains: List[Any] = []
    weather: Any = None

class Signal(BaseModel):
    id: str
    name: str
    route_id: str
    block_index: int = 0
    block_id: str = ""
    lat: float = 0.0
    lng: float = 0.0
    aspect: str = "clear"
    status: str = "operational"
    health_score: float = 100.0
    health: int = 100
    failure: bool = False
    occupied: bool = False
    maintenance: bool = False
