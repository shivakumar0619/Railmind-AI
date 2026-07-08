import heapq
from typing import List, Dict, Any
from app.services.simulation import simulation_engine

class RoutingService:
    @staticmethod
    def _build_graph():
        graph = {}
        for route in simulation_engine.state.get("routes", []):
            src = route["source_code"]
            tgt = route["target_code"]
            dist = route.get("distance_km", 1)
            speed = route.get("max_speed_kmh", 100)
            travel_time = max(1, (dist / speed) * 60)
            
            if src not in graph: graph[src] = []
            if tgt not in graph: graph[tgt] = []
            
            graph[src].append({"target": tgt, "distance": dist, "time": travel_time, "route_id": route["id"]})
            graph[tgt].append({"target": src, "distance": dist, "time": travel_time, "route_id": route["id"]})
            
        return graph

    @staticmethod
    def dijkstra(start: str, end: str, weight_key: str = "time") -> Dict[str, Any]:
        graph = RoutingService._build_graph()
        if start not in graph or end not in graph:
            return {"path": [], "distance": 0, "time": 0, "route_ids": []}
            
        queue = [(0, start, [], [], 0)] # (weight, current_node, path, route_ids, alt_weight)
        visited = set()
        
        while queue:
            weight, current, path, route_ids, alt_weight = heapq.heappop(queue)
            
            if current in visited:
                continue
            visited.add(current)
            
            path = path + [current]
            
            if current == end:
                if weight_key == "time":
                    return {"path": path, "time": weight, "distance": alt_weight, "route_ids": route_ids}
                else:
                    return {"path": path, "distance": weight, "time": alt_weight, "route_ids": route_ids}
                    
            for neighbor in graph[current]:
                if neighbor["target"] not in visited:
                    edge_weight = neighbor[weight_key]
                    edge_alt = neighbor["distance"] if weight_key == "time" else neighbor["time"]
                    heapq.heappush(queue, (
                        weight + edge_weight, 
                        neighbor["target"], 
                        path, 
                        route_ids + [neighbor["route_id"]], 
                        alt_weight + edge_alt
                    ))
                    
        return {"path": [], "distance": 0, "time": 0, "route_ids": []}

    @staticmethod
    def plan_route(origin: str, destination: str, via: str = None, preference: str = "fastest"):
        weight_key = "distance" if preference == "shortest" else "time"
        
        if via:
            leg1 = RoutingService.dijkstra(origin, via, weight_key)
            if not leg1["path"]: return None
            leg2 = RoutingService.dijkstra(via, destination, weight_key)
            if not leg2["path"]: return None
            
            return {
                "path": leg1["path"][:-1] + leg2["path"],
                "route_ids": leg1["route_ids"] + leg2["route_ids"],
                "distance": round(leg1["distance"] + leg2["distance"], 1),
                "eta_minutes": round(leg1["time"] + leg2["time"], 1)
            }
        else:
            res = RoutingService.dijkstra(origin, destination, weight_key)
            if not res["path"]: return None
            res["distance"] = round(res["distance"], 1)
            res["eta_minutes"] = round(res["time"], 1)
            return res

routing_service = RoutingService()
