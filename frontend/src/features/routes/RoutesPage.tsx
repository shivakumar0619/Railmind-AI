import { useState } from "react";
import { Route as RouteIcon, Zap, Gauge, Hash, Map, Train, Activity, ShieldCheck, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import FilterBar, { FilterConfig } from "../../components/shared/FilterBar";

interface RouteData {
  id: string;
  name: string;
  code: string;
  corridor: string;
  distance_km: number;
  stations_count: number;
  track_type: string;
  electrified: boolean;
  max_speed_kmh: number;
  status: string;
  congestion?: string;
  current_trains?: number;
}

export default function RoutesPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data: routesData, isLoading } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => (await api.get("/api/routes")).data.data,
    refetchInterval: 10000,
  });

  const routes = routesData || [];

  const filterConfigs: FilterConfig[] = [
    { id: "search", label: "Route", type: "search", placeholder: "Search Code or Name" },
    { id: "corridor", label: "Corridor", type: "select", options: [
      { label: "Mainline", value: "Mainline" },
      { label: "Branch", value: "Branch" },
      { label: "Freight", value: "Freight" },
    ]},
    { id: "congestion", label: "Congestion", type: "select", options: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
    ]},
    { id: "distance", label: "Distance", type: "select", options: [
      { label: "< 50 km", value: "short" },
      { label: "50 - 100 km", value: "medium" },
      { label: "> 100 km", value: "long" },
    ]},
    { id: "electrified", label: "Electrified Only", type: "boolean" }
  ];

  const filteredRoutes = routes.filter((r: RouteData) => {
    if (filters.search && !(r.name || "").toLowerCase().includes(filters.search.toLowerCase()) && !(r.code || "").toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.corridor && r.corridor !== filters.corridor) return false;
    if (filters.congestion && (r.congestion || "low") !== filters.congestion) return false;
    if (filters.electrified && !r.electrified) return false;
    if (filters.distance) {
      if (filters.distance === 'short' && r.distance_km >= 50) return false;
      if (filters.distance === 'medium' && (r.distance_km < 50 || r.distance_km > 100)) return false;
      if (filters.distance === 'long' && r.distance_km <= 100) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Routes</h1>
        <p className="mt-1 text-sm text-text-secondary">Railway corridor routes and sections</p>
      </div>

      <FilterBar configs={filterConfigs} onFilterChange={setFilters} />

      {isLoading && !routesData ? (
        <div className="flex justify-center p-12">
          <Activity className="h-8 w-8 animate-pulse text-accent" />
        </div>
      ) : (
      <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5"/> Code / Name</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Map className="h-3.5 w-3.5"/> Distance</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5"/> Max Speed</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5"/> Congestion</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Train className="h-3.5 w-3.5"/> Current Trains</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5"/> Status</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 opacity-50" />
                      <p>No routes found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route: RouteData) => {
                  const congestion = route.congestion ?? "low";
                  const trainsCount = route.current_trains ?? 0;
                  
                  return (
                    <tr key={route.id} className="group transition-colors hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/10 border border-accent/20">
                            <RouteIcon className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary flex items-center gap-2">
                              {route.name || route.code}
                              {route.electrified && <Zap className="h-3 w-3 text-status-warning" />}
                            </div>
                            <div className="font-mono text-xs text-text-muted mt-0.5">{route.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-text-secondary">{(route.distance_km || 0).toFixed(1)} km</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{route.stations_count || 0} stations</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-white/5 px-2 py-1 font-mono text-xs text-text-secondary border border-white/10">{route.max_speed_kmh} km/h</span>
                      </td>
                      <td className="px-4 py-3">
                        <CongestionBadge level={congestion} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-text-secondary">
                          <Train className="h-3.5 w-3.5 text-text-muted" />
                          {trainsCount}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={route.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

function CongestionBadge({ level }: { level: string }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    low: { color: "text-status-success", bg: "bg-status-success-muted/20", border: "border-status-success/30" },
    medium: { color: "text-status-warning", bg: "bg-status-warning-muted/20", border: "border-status-warning/30" },
    high: { color: "text-[#f97316]", bg: "bg-[#f97316]/20", border: "border-[#f97316]/30" },
    critical: { color: "text-status-danger", bg: "bg-status-danger-muted/20", border: "border-status-danger/30" },
  };
  const s = map[level?.toLowerCase()] || map.low;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${s.color} ${s.bg} ${s.border}`}>{level}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    active: { color: "text-status-success", bg: "bg-status-success-muted/20", border: "border-status-success/30" },
    maintenance: { color: "text-status-warning", bg: "bg-status-warning-muted/20", border: "border-status-warning/30" },
    closed: { color: "text-status-danger", bg: "bg-status-danger-muted/20", border: "border-status-danger/30" },
  };
  const s = map[status?.toLowerCase()] || map.active;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border capitalize ${s.color} ${s.bg} ${s.border}`}>{status}</span>;
}
