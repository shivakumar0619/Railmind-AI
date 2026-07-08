import { useEffect, useState } from "react";
import { Train as TrainIcon, Clock, Gauge, MapPin } from "lucide-react";

interface TrainData {
  id: string;
  number: string;
  name: string;
  type: string;
  status: string;
  speed_kmh: number;
  current_station: string;
  next_station: string;
  delay_minutes: number;
  route: string;
  last_updated: string;
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  running: { label: "Running", color: "text-status-success", bg: "bg-status-success-muted" },
  at_station: { label: "At Station", color: "text-status-info", bg: "bg-status-info-muted" },
  stopped: { label: "Stopped", color: "text-status-danger", bg: "bg-status-danger-muted" },
  delayed: { label: "Delayed", color: "text-status-warning", bg: "bg-status-warning-muted" },
  maintenance: { label: "Maintenance", color: "text-text-muted", bg: "bg-bg-surface-hover" },
};

export default function TrainsPage() {
  const [trains, setTrains] = useState<TrainData[]>([]);

  useEffect(() => {
    fetch("/api/trains").then(r => r.json()).then(d => setTrains(d.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Trains</h1>
          <p className="mt-1 text-sm text-text-secondary">Active trains on the corridor</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5">
          <TrainIcon className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">{trains.length} active</span>
        </div>
      </div>

      {/* Train Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {trains.map(train => {
          const s = STATUS_STYLES[train.status] || STATUS_STYLES.running;
          return (
            <div key={train.id} className="card-interactive card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-text-primary">{train.number}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.color} ${s.bg}`}>{s.label}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-secondary">{train.name}</p>
                  <p className="text-xs text-text-muted">{train.type} · Route: {train.route}</p>
                </div>
                {train.status === "running" && (
                  <div className="flex items-center gap-1 rounded-lg bg-bg-surface-hover px-2 py-1">
                    <Gauge className="h-3 w-3 text-text-muted" />
                    <span className="font-mono text-sm font-medium text-text-primary">{train.speed_kmh} km/h</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-accent" />
                  <span className="text-text-secondary">At: <span className="font-mono font-medium text-text-primary">{train.current_station}</span></span>
                </div>
                <span className="text-text-muted">→</span>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-text-muted" />
                  <span className="text-text-secondary">Next: <span className="font-mono text-text-primary">{train.next_station}</span></span>
                </div>
              </div>

              {train.delay_minutes !== 0 && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-status-warning-muted px-2.5 py-1.5">
                  <Clock className="h-3 w-3 text-status-warning" />
                  <span className="text-xs font-medium text-status-warning">
                    {train.delay_minutes > 0 ? `+${train.delay_minutes} min late` : `${train.delay_minutes} min early`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
