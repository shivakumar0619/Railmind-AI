import json
from pathlib import Path
import math

MOCK_DATA_DIR = Path(__file__).parent.parent / "app" / "mock_data"
MOCK_DATA_DIR.mkdir(parents=True, exist_ok=True)

# 1. STATIONS
stations = [
    {"id": "st_001", "code": "SC", "name": "Secunderabad Jn", "lat": 17.4337, "lng": 78.5016, "platforms": 10, "zone": "SCR", "division": "SC", "elevation": 536},
    {"id": "st_002", "code": "BMT", "name": "Begumpet", "lat": 17.4435, "lng": 78.4611, "platforms": 2, "zone": "SCR", "division": "SC", "elevation": 540},
    {"id": "st_003", "code": "LPI", "name": "Lingampalli", "lat": 17.4834, "lng": 78.3188, "platforms": 6, "zone": "SCR", "division": "SC", "elevation": 559},
    {"id": "st_004", "code": "HYB", "name": "Hyderabad Deccan", "lat": 17.3916, "lng": 78.4770, "platforms": 6, "zone": "SCR", "division": "SC", "elevation": 506},
    {"id": "st_005", "code": "KZJ", "name": "Kazipet Jn", "lat": 17.9756, "lng": 79.5284, "platforms": 3, "zone": "SCR", "division": "SC", "elevation": 286},
    {"id": "st_006", "code": "WL", "name": "Warangal", "lat": 17.9818, "lng": 79.5997, "platforms": 4, "zone": "SCR", "division": "SC", "elevation": 302},
    {"id": "st_007", "code": "MABD", "name": "Mahbubabad", "lat": 17.6033, "lng": 80.0039, "platforms": 2, "zone": "SCR", "division": "SC", "elevation": 198},
    {"id": "st_008", "code": "KMT", "name": "Khammam", "lat": 17.2536, "lng": 80.1417, "platforms": 3, "zone": "SCR", "division": "SC", "elevation": 118},
    {"id": "st_009", "code": "GNT", "name": "Guntur Jn", "lat": 16.3056, "lng": 80.4431, "platforms": 7, "zone": "SCR", "division": "GNT", "elevation": 32},
    {"id": "st_010", "code": "MAG", "name": "Mangalagiri", "lat": 16.4278, "lng": 80.5750, "platforms": 3, "zone": "SCR", "division": "GNT", "elevation": 33},
    {"id": "st_011", "code": "BZA", "name": "Vijayawada Jn", "lat": 16.5186, "lng": 80.6200, "platforms": 10, "zone": "SCR", "division": "BZA", "elevation": 19},
    {"id": "st_012", "code": "TEL", "name": "Tenali Jn", "lat": 16.2372, "lng": 80.6475, "platforms": 5, "zone": "SCR", "division": "BZA", "elevation": 11},
    {"id": "st_013", "code": "OGL", "name": "Ongole", "lat": 15.5057, "lng": 80.0499, "platforms": 3, "zone": "SCR", "division": "BZA", "elevation": 8},
    {"id": "st_014", "code": "NLR", "name": "Nellore", "lat": 14.4426, "lng": 79.9865, "platforms": 4, "zone": "SCR", "division": "BZA", "elevation": 18},
    {"id": "st_015", "code": "GDR", "name": "Gudur Jn", "lat": 14.1466, "lng": 79.8517, "platforms": 3, "zone": "SCR", "division": "BZA", "elevation": 19},
    {"id": "st_016", "code": "RU", "name": "Renigunta Jn", "lat": 13.6391, "lng": 79.5218, "platforms": 5, "zone": "SCR", "division": "GTL", "elevation": 115},
    {"id": "st_017", "code": "TPTY", "name": "Tirupati", "lat": 13.6288, "lng": 79.4192, "platforms": 6, "zone": "SCR", "division": "GTL", "elevation": 163},
]

# 2. ROUTES
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dLon / 2) * math.sin(dLon / 2)
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

route_pairs = [
    ("LPI", "BMT"), ("BMT", "SC"), ("HYB", "SC"), ("SC", "KZJ"), ("KZJ", "WL"),
    ("WL", "MABD"), ("MABD", "KMT"), ("KMT", "BZA"),
    ("SC", "GNT"), ("GNT", "MAG"), ("MAG", "BZA"),
    ("GNT", "TEL"), ("BZA", "TEL"),
    ("TEL", "OGL"), ("OGL", "NLR"), ("NLR", "GDR"),
    ("GDR", "RU"), ("RU", "TPTY")
]

routes = []
st_map = {s["code"]: s for s in stations}
for i, (src, tgt) in enumerate(route_pairs):
    s1, s2 = st_map[src], st_map[tgt]
    dist = haversine(s1["lat"], s1["lng"], s2["lat"], s2["lng"])
    routes.append({
        "id": f"rt_{src.lower()}_{tgt.lower()}",
        "code": f"{src}-{tgt}",
        "source_code": src,
        "target_code": tgt,
        "distance_km": round(dist * 1.1, 1), # slightly curved distance
        "max_speed_kmh": 130 if src in ["SC", "KZJ", "WL", "BZA"] else 110,
        "block_count": max(2, int(dist / 5)), # one block roughly every 5km
        "corridor": "Mainline",
        "operational_status": "normal"
    })

# 3. TRAINS (Increase significantly as requested)
train_types = ["Rajdhani", "Shatabdi", "Superfast", "Express", "Passenger", "Freight", "MEMU", "Intercity"]
trains = []

train_templates = [
    {"num": "12704", "name": "Falaknuma Express", "type": "Superfast", "path": ["SC", "GNT", "MAG", "BZA"]},
    {"num": "12703", "name": "Falaknuma Exp (Up)", "type": "Superfast", "path": ["BZA", "MAG", "GNT", "SC"]},
    {"num": "12711", "name": "Pinakini Express", "type": "Superfast", "path": ["BZA", "TEL", "OGL", "NLR", "GDR"]},
    {"num": "12712", "name": "Pinakini Exp (Up)", "type": "Superfast", "path": ["GDR", "NLR", "OGL", "TEL", "BZA"]},
    {"num": "20701", "name": "Vande Bharat Express", "type": "Shatabdi", "path": ["SC", "KZJ", "WL", "KMT", "BZA"]},
    {"num": "20702", "name": "Vande Bharat (Up)", "type": "Shatabdi", "path": ["BZA", "KMT", "WL", "KZJ", "SC"]},
    {"num": "12797", "name": "Venkatadri Express", "type": "Express", "path": ["HYB", "SC", "KZJ", "WL", "MABD", "KMT", "BZA", "TEL", "OGL", "NLR", "GDR", "RU", "TPTY"]},
    {"num": "12798", "name": "Venkatadri (Up)", "type": "Express", "path": ["TPTY", "RU", "GDR", "NLR", "OGL", "TEL", "BZA", "KMT", "MABD", "WL", "KZJ", "SC", "HYB"]},
    {"num": "17201", "name": "Golconda Express", "type": "Intercity", "path": ["SC", "KZJ", "WL", "MABD", "KMT", "BZA"]},
    {"num": "17202", "name": "Golconda (Up)", "type": "Intercity", "path": ["BZA", "KMT", "MABD", "WL", "KZJ", "SC"]},
    {"num": "47101", "name": "LPI-HYB MEMU", "type": "MEMU", "path": ["LPI", "BMT", "HYB"]},
    {"num": "47102", "name": "HYB-LPI MEMU", "type": "MEMU", "path": ["HYB", "BMT", "LPI"]},
    {"num": "F8012", "name": "Coal BOXN", "type": "Freight", "path": ["KZJ", "SC", "LPI"]},
    {"num": "F8013", "name": "Container BLC", "type": "Freight", "path": ["BZA", "GNT", "SC"]},
]

for i, t in enumerate(train_templates):
    route_ids = []
    for j in range(len(t["path"]) - 1):
        src = t["path"][j]
        tgt = t["path"][j+1]
        route_id = f"rt_{src.lower()}_{tgt.lower()}"
        if not any(r["id"] == route_id for r in routes):
            route_id = f"rt_{tgt.lower()}_{src.lower()}"
        route_ids.append(route_id)
        
    speed_map = {"Shatabdi": 130, "Rajdhani": 130, "Superfast": 110, "Express": 90, "Intercity": 100, "Passenger": 70, "MEMU": 60, "Freight": 55}
    pri_map = {"Shatabdi": 1, "Rajdhani": 1, "Superfast": 2, "Express": 3, "Intercity": 3, "Passenger": 4, "MEMU": 4, "Freight": 5}
    
    trains.append({
        "id": f"tr_{t['num']}",
        "number": t["num"],
        "name": t["name"],
        "type": t["type"],
        "priority": pri_map[t["type"]],
        "origin": t["path"][0],
        "destination": t["path"][-1],
        "path": route_ids,
        "current_route_id": route_ids[0],
        "path_index": 0,
        "status": "running" if i % 4 != 0 else "waiting",
        "progress_pct": (i * 7) % 100,
        "delay_minutes": 0,
        "max_speed_kmh": speed_map[t["type"]],
        "current_speed_kmh": speed_map[t["type"]],
        "travel_direction": "forward" if t["path"][0] == route_ids[0].split("_")[1].upper() else "reverse"
    })

# Add a few more random freight and passenger trains to hit ~27 trains
import random
random.seed(42)
extra_paths = [
    ["SC", "KZJ"], ["BZA", "TEL", "OGL"], ["TPTY", "RU", "GDR", "NLR"], ["GNT", "MAG", "BZA"], ["LPI", "BMT", "SC", "KZJ"]
]
for i in range(15, 30):
    p = random.choice(extra_paths)
    if random.choice([True, False]): p = p[::-1] # Reverse
    t_type = random.choice(["Freight", "Passenger", "Express", "MEMU"])
    
    route_ids = []
    for j in range(len(p) - 1):
        src = p[j]
        tgt = p[j+1]
        route_id = f"rt_{src.lower()}_{tgt.lower()}"
        if not any(r["id"] == route_id for r in routes):
            route_id = f"rt_{tgt.lower()}_{src.lower()}"
        route_ids.append(route_id)
        
    speed_map = {"Superfast": 110, "Express": 90, "Intercity": 100, "Passenger": 70, "MEMU": 60, "Freight": 55}
    pri_map = {"Superfast": 2, "Express": 3, "Intercity": 3, "Passenger": 4, "MEMU": 4, "Freight": 5}
    
    trains.append({
        "id": f"tr_extra_{i}",
        "number": f"{random.randint(40000, 80000)}",
        "name": f"{p[0]}-{p[-1]} {t_type}",
        "type": t_type,
        "priority": pri_map[t_type],
        "origin": p[0],
        "destination": p[-1],
        "path": route_ids,
        "current_route_id": route_ids[0],
        "path_index": 0,
        "status": "running",
        "progress_pct": random.randint(5, 95),
        "delay_minutes": random.choice([0, 0, 0, 5, 12, 45]),
        "max_speed_kmh": speed_map[t_type],
        "current_speed_kmh": speed_map[t_type],
        "travel_direction": "forward" if p[0] == route_ids[0].split("_")[1].upper() else "reverse"
    })

# 4. CONFIG
config = {
    "tick_rate_ms": 1000,
    "simulation_speed_multiplier": 60,
    "delay_increment_minutes": 1,
    "random_incident_chance": 0.05
}

# SAVE
with open(MOCK_DATA_DIR / "stations.json", "w") as f: json.dump(stations, f, indent=2)
with open(MOCK_DATA_DIR / "routes.json", "w") as f: json.dump(routes, f, indent=2)
with open(MOCK_DATA_DIR / "trains.json", "w") as f: json.dump(trains, f, indent=2)
with open(MOCK_DATA_DIR / "config.json", "w") as f: json.dump(config, f, indent=2)

print("Mock data generated successfully in", MOCK_DATA_DIR)
