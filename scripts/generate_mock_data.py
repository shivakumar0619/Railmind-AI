import json
import math
import random
from pathlib import Path

MOCK_DATA_DIR = Path("../backend/app/mock_data").resolve()

def generate_bezier_curve(p0, p1, p2, num_points=20):
    """Generate a quadratic Bezier curve between p0 and p2, using control point p1."""
    curve = []
    for i in range(num_points + 1):
        t = i / num_points
        x = (1 - t)**2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
        y = (1 - t)**2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
        curve.append([round(x, 6), round(y, 6)])
    return curve

def get_control_point(p0, p2, offset=0.05):
    """Generate a control point perpendicular to the midpoint to create a natural curve."""
    mid_x = (p0[0] + p2[0]) / 2
    mid_y = (p0[1] + p2[1]) / 2
    
    # Calculate perpendicular vector
    dx = p2[0] - p0[0]
    dy = p2[1] - p0[1]
    
    # Randomly curve left or right
    direction = random.choice([-1, 1])
    
    ctrl_x = mid_x - direction * dy * offset
    ctrl_y = mid_y + direction * dx * offset
    
    return (ctrl_x, ctrl_y)

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# 1. STATIONS
stations = [
    {"code": "SC", "name": "Secunderabad Jn", "lat": 17.4337, "lng": 78.5016, "platforms": 10, "zone": "SCR", "division": "SC"},
    {"code": "HYB", "name": "Hyderabad Deccan", "lat": 17.3916, "lng": 78.4770, "platforms": 6, "zone": "SCR", "division": "SC"},
    {"code": "BMT", "name": "Begumpet", "lat": 17.4435, "lng": 78.4611, "platforms": 2, "zone": "SCR", "division": "SC"},
    {"code": "LPI", "name": "Lingampalli", "lat": 17.4834, "lng": 78.3188, "platforms": 6, "zone": "SCR", "division": "SC"},
    {"code": "KZJ", "name": "Kazipet Jn", "lat": 17.9756, "lng": 79.5284, "platforms": 3, "zone": "SCR", "division": "SC"},
    {"code": "WL", "name": "Warangal", "lat": 17.9818, "lng": 79.5997, "platforms": 4, "zone": "SCR", "division": "SC"},
    {"code": "MABD", "name": "Mahbubabad", "lat": 17.6033, "lng": 80.0039, "platforms": 2, "zone": "SCR", "division": "SC"},
    {"code": "KMT", "name": "Khammam", "lat": 17.2536, "lng": 80.1417, "platforms": 3, "zone": "SCR", "division": "SC"},
    {"code": "BZA", "name": "Vijayawada Jn", "lat": 16.5186, "lng": 80.6200, "platforms": 10, "zone": "SCR", "division": "BZA"},
    {"code": "GNT", "name": "Guntur Jn", "lat": 16.3056, "lng": 80.4431, "platforms": 7, "zone": "SCR", "division": "GNT"},
    {"code": "MAG", "name": "Mangalagiri", "lat": 16.4278, "lng": 80.5750, "platforms": 3, "zone": "SCR", "division": "GNT"},
    {"code": "TEL", "name": "Tenali Jn", "lat": 16.2372, "lng": 80.6475, "platforms": 5, "zone": "SCR", "division": "BZA"},
    {"code": "OGL", "name": "Ongole", "lat": 15.5057, "lng": 80.0499, "platforms": 3, "zone": "SCR", "division": "BZA"},
    {"code": "NLR", "name": "Nellore", "lat": 14.4426, "lng": 79.9865, "platforms": 4, "zone": "SCR", "division": "BZA"},
    {"code": "GDR", "name": "Gudur Jn", "lat": 14.1466, "lng": 79.8517, "platforms": 3, "zone": "SCR", "division": "BZA"},
    {"code": "RU", "name": "Renigunta Jn", "lat": 13.6391, "lng": 79.5218, "platforms": 5, "zone": "SCR", "division": "GTL"},
    {"code": "TPTY", "name": "Tirupati", "lat": 13.6288, "lng": 79.4192, "platforms": 6, "zone": "SCR", "division": "GTL"},
    {"code": "NLDA", "name": "Nalgonda", "lat": 17.0620, "lng": 79.2612, "platforms": 2, "zone": "SCR", "division": "GNT"},
    {"code": "MRGA", "name": "Miryalaguda", "lat": 16.8833, "lng": 79.5667, "platforms": 2, "zone": "SCR", "division": "GNT"},
    {"code": "PGRL", "name": "Piduguralla", "lat": 16.4833, "lng": 79.8833, "platforms": 2, "zone": "SCR", "division": "GNT"},
    {"code": "NDKD", "name": "Nadikudi Jn", "lat": 16.5833, "lng": 79.6167, "platforms": 3, "zone": "SCR", "division": "GNT"},
    {"code": "GTL", "name": "Guntakal Jn", "lat": 15.1667, "lng": 77.3833, "platforms": 6, "zone": "SCR", "division": "GTL"},
    {"code": "NED", "name": "Hazur Sahib Nanded", "lat": 19.1500, "lng": 77.3000, "platforms": 4, "zone": "SCR", "division": "NED"},
]

for i, s in enumerate(stations):
    s["id"] = f"st_{i+1:03d}"

station_dict = {s["code"]: s for s in stations}

# 2. ROUTES
route_pairs = [
    # Mainline SC-BZA
    ("LPI", "BMT", 110), ("BMT", "SC", 110), ("HYB", "SC", 110),
    ("SC", "KZJ", 130), ("KZJ", "WL", 130), ("WL", "MABD", 130),
    ("MABD", "KMT", 130), ("KMT", "BZA", 130),
    # SC-GNT via Nalgonda (Pagidipalli-Nallapadu line)
    ("SC", "NLDA", 110), ("NLDA", "MRGA", 110), ("MRGA", "NDKD", 110),
    ("NDKD", "PGRL", 110), ("PGRL", "GNT", 110),
    # GNT-BZA
    ("GNT", "MAG", 110), ("MAG", "BZA", 110),
    # GNT-TEL
    ("GNT", "TEL", 110),
    # BZA-TPTY (Grand Trunk Route)
    ("BZA", "TEL", 130), ("TEL", "OGL", 130), ("OGL", "NLR", 130),
    ("NLR", "GDR", 130), ("GDR", "RU", 110), ("RU", "TPTY", 110),
    # Other connections
    ("GTL", "RU", 110), ("KZJ", "NED", 110)
]

routes = []
for src, tgt, max_speed in route_pairs:
    s_src = station_dict[src]
    s_tgt = station_dict[tgt]
    
    # Calculate realistic distance + 10% for curves
    dist_km = round(calculate_distance(s_src["lat"], s_src["lng"], s_tgt["lat"], s_tgt["lng"]) * 1.1, 1)
    
    # Generate curved polyline
    p0 = (s_src["lng"], s_src["lat"])
    p2 = (s_tgt["lng"], s_tgt["lat"])
    p1 = get_control_point(p0, p2, offset=0.15)
    
    polyline = generate_bezier_curve(p0, p1, p2, num_points=max(10, int(dist_km / 5)))
    
    routes.append({
        "id": f"rt_{src.lower()}_{tgt.lower()}",
        "code": f"{src}-{tgt}",
        "source_code": src,
        "target_code": tgt,
        "distance_km": dist_km,
        "max_speed_kmh": max_speed,
        "block_count": max(2, int(dist_km / 3)), # Blocks every ~3 km
        "corridor": "Mainline" if max_speed == 130 else "Branch",
        "operational_status": "normal",
        "polyline": polyline
    })

# 3. TRAINS
trains = []

train_templates = [
    {"type": "Vande Bharat Express", "max_speed": 130, "priority": 1, "prefix": "207"},
    {"type": "Rajdhani Express", "max_speed": 130, "priority": 1, "prefix": "124"},
    {"type": "Duronto Express", "max_speed": 130, "priority": 1, "prefix": "122"},
    {"type": "Superfast Express", "max_speed": 110, "priority": 2, "prefix": "127"},
    {"type": "Mail/Express", "max_speed": 110, "priority": 3, "prefix": "172"},
    {"type": "Passenger/MEMU", "max_speed": 90, "priority": 4, "prefix": "471"},
    {"type": "Freight", "max_speed": 75, "priority": 5, "prefix": "F80"},
]

paths = [
    ["rt_lpi_bmt", "rt_bmt_sc", "rt_sc_kzj", "rt_kzj_wl", "rt_wl_mabd", "rt_mabd_kmt", "rt_kmt_bza"],
    ["rt_sc_kzj", "rt_kzj_ned"],
    ["rt_sc_nlda", "rt_nlda_mrga", "rt_mrga_ndkd", "rt_ndkd_pgrl", "rt_pgrl_gnt", "rt_gnt_mag", "rt_mag_bza"],
    ["rt_bza_tel", "rt_tel_ogl", "rt_ogl_nlr", "rt_nlr_gdr", "rt_gdr_ru", "rt_ru_tpty"],
    ["rt_sc_nlda", "rt_nlda_mrga", "rt_mrga_ndkd", "rt_ndkd_pgrl", "rt_pgrl_gnt", "rt_gnt_tel", "rt_tel_ogl", "rt_ogl_nlr", "rt_nlr_gdr", "rt_gdr_ru", "rt_ru_tpty"]
]

train_count = 1
for template in train_templates:
    count = 10 if template["priority"] <= 3 else (15 if template["type"] == "Freight" else 5)
    
    for _ in range(count):
        path_idx = random.randint(0, len(paths) - 1)
        path = paths[path_idx]
        
        # Determine origin/dest
        first_rt = next(r for r in routes if r["id"] == path[0])
        last_rt = next(r for r in routes if r["id"] == path[-1])
        origin = first_rt["source_code"]
        dest = last_rt["target_code"]
        
        # Randomly start somewhere along the path
        start_idx = random.randint(0, len(path) - 1)
        
        trains.append({
            "id": f"trn_{train_count:04d}",
            "number": f"{template['prefix']}{train_count:02d}",
            "name": f"{origin}-{dest} {template['type']}",
            "origin": origin,
            "destination": dest,
            "path": path,
            "original_path": path,
            "current_route_id": path[start_idx],
            "path_index": start_idx,
            "progress_pct": random.uniform(0, 95),
            "status": "running",
            "lifecycle": "running",
            "travel_direction": "forward",
            "current_speed_kmh": template["max_speed"] * random.uniform(0.7, 0.9),
            "max_speed_kmh": template["max_speed"],
            "priority": template["priority"],
            "delay_minutes": random.randint(0, 15) if random.random() > 0.7 else 0,
            "trips_completed": 0,
            "_at_terminal": False
        })
        train_count += 1

# Reverse paths for some trains
for t in trains[::2]:
    t["path"] = t["path"][::-1]
    t["original_path"] = t["path"]
    t["origin"], t["destination"] = t["destination"], t["origin"]
    t["travel_direction"] = "reverse"
    t["path_index"] = len(t["path"]) - 1 - t["path_index"]

MOCK_DATA_DIR.mkdir(parents=True, exist_ok=True)
with open(MOCK_DATA_DIR / "stations.json", "w") as f: json.dump(stations, f, indent=2)
with open(MOCK_DATA_DIR / "routes.json", "w") as f: json.dump(routes, f, indent=2)
with open(MOCK_DATA_DIR / "trains.json", "w") as f: json.dump(trains, f, indent=2)
print(f"Generated {len(stations)} stations, {len(routes)} routes, {len(trains)} trains.")
