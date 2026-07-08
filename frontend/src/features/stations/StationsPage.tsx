import { useEffect, useState } from "react";
import { Building2, MapPin, Zap } from "lucide-react";

interface Station {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  platforms: number;
  is_junction: boolean;
  zone: string;
  division: string;
  km: number;
  status: string;
  electrified: boolean;
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    fetch("/api/stations").then(r => r.json()).then(d => setStations(d.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Stations</h1>
          <p className="mt-1 text-sm text-text-secondary">Secunderabad–Kazipet–Vijayawada corridor</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5">
          <Building2 className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">{stations.length} stations</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary bg-bg-elevated">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Station</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">KM</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Platforms</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Division</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station, i) => (
                <tr key={station.id} className={`border-b border-border-subtle transition-colors hover:bg-bg-surface-hover ${i % 2 === 0 ? "" : "bg-bg-elevated/30"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{station.name}</span>
                      {station.is_junction && <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">JN</span>}
                      {station.electrified && <Zap className="h-3 w-3 text-status-warning" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-bg-surface-hover px-1.5 py-0.5 font-mono text-xs text-text-secondary">{station.code}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{station.km.toFixed(1)}</td>
                  <td className="px-4 py-3 text-text-secondary">{station.platforms}</td>
                  <td className="px-4 py-3 text-text-secondary">{station.division}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={station.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Station Map Preview (coordinates summary) */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-text-primary">Corridor Overview</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-bg-elevated p-3">
            <p className="text-2xl font-bold text-text-primary font-mono">{stations.length}</p>
            <p className="text-xs text-text-muted">Total Stations</p>
          </div>
          <div className="rounded-lg bg-bg-elevated p-3">
            <p className="text-2xl font-bold text-text-primary font-mono">{stations.filter(s => s.is_junction).length}</p>
            <p className="text-xs text-text-muted">Junctions</p>
          </div>
          <div className="rounded-lg bg-bg-elevated p-3">
            <p className="text-2xl font-bold text-text-primary font-mono">{stations.length > 0 ? stations[stations.length - 1]?.km.toFixed(0) : 0}</p>
            <p className="text-xs text-text-muted">Total KM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    operational: { label: "Operational", color: "text-status-success", bg: "bg-status-success-muted" },
    maintenance: { label: "Maintenance", color: "text-status-warning", bg: "bg-status-warning-muted" },
    closed: { label: "Closed", color: "text-status-danger", bg: "bg-status-danger-muted" },
  };
  const s = map[status] || map.operational;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.color} ${s.bg}`}>{s.label}</span>;
}
