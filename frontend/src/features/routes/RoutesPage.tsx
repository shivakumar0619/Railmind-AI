import { useEffect, useState } from "react";
import { Route as RouteIcon, Zap, Gauge } from "lucide-react";

interface RouteData {
  id: string;
  name: string;
  code: string;
  corridor: string;
  total_distance_km: number;
  stations_count: number;
  track_type: string;
  electrified: boolean;
  max_speed_kmh: number;
  status: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);

  useEffect(() => {
    fetch("/api/routes").then(r => r.json()).then(d => setRoutes(d.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Routes</h1>
        <p className="mt-1 text-sm text-text-secondary">Railway corridor routes and sections</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {routes.map(route => (
          <div key={route.id} className="card-interactive card">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-accent/10 p-2">
                <RouteIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{route.name}</h3>
                <p className="text-xs text-text-muted font-mono">{route.code}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Distance" value={`${route.total_distance_km} km`} />
              <Stat label="Stations" value={route.stations_count.toString()} />
              <Stat label="Track" value={route.track_type} />
              <Stat label="Max Speed" value={`${route.max_speed_kmh} km/h`} />
            </div>

            <div className="mt-3 flex items-center gap-2">
              {route.electrified && (
                <span className="flex items-center gap-1 rounded-full bg-status-warning-muted px-2 py-0.5 text-[10px] font-medium text-status-warning">
                  <Zap className="h-3 w-3" /> Electrified
                </span>
              )}
              <span className="rounded-full bg-status-success-muted px-2 py-0.5 text-[10px] font-medium capitalize text-status-success">
                {route.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-elevated px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-mono text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
