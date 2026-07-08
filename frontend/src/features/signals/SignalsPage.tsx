import { useEffect, useState } from "react";
import { CircleDot, AlertTriangle, Wrench, CheckCircle2 } from "lucide-react";

interface SignalData {
  id: string;
  name: string;
  type: string;
  station_code: string;
  aspect: string;
  status: string;
  lat: number;
  lng: number;
}

interface SignalSummary {
  total: number;
  operational: number;
  degraded: number;
  maintenance: number;
  failed: number;
  health_percentage: number;
}

const ASPECT_COLORS: Record<string, string> = {
  clear: "#16a34a",
  caution: "#eab308",
  attention: "#ca8a04",
  stop: "#dc2626",
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  operational: { icon: CheckCircle2, color: "text-status-success", bg: "bg-status-success-muted" },
  degraded: { icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning-muted" },
  maintenance: { icon: Wrench, color: "text-status-info", bg: "bg-status-info-muted" },
  failed: { icon: AlertTriangle, color: "text-status-danger", bg: "bg-status-danger-muted" },
};

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [summary, setSummary] = useState<SignalSummary | null>(null);

  useEffect(() => {
    fetch("/api/signals").then(r => r.json()).then(d => setSignals(d.data));
    fetch("/api/signals/summary").then(r => r.json()).then(d => setSummary(d.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Signals</h1>
        <p className="mt-1 text-sm text-text-secondary">Signal monitoring and health status</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <SummaryCard label="Total" value={summary.total} color="text-text-primary" />
          <SummaryCard label="Operational" value={summary.operational} color="text-status-success" />
          <SummaryCard label="Degraded" value={summary.degraded} color="text-status-warning" />
          <SummaryCard label="Maintenance" value={summary.maintenance} color="text-status-info" />
          <SummaryCard label="Failed" value={summary.failed} color="text-status-danger" />
        </div>
      )}

      {/* Signals Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {signals.map(signal => {
          const cfg = STATUS_CONFIG[signal.status] || STATUS_CONFIG.operational;
          const StatusIcon = cfg.icon;
          return (
            <div key={signal.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full signal-pulse" style={{ backgroundColor: ASPECT_COLORS[signal.aspect] || "#71717a" }} />
                  <span className="font-mono text-sm font-bold text-text-primary">{signal.name}</span>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color} ${cfg.bg}`}>
                  <StatusIcon className="h-3 w-3" />
                  {signal.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                <span>Type: <span className="capitalize text-text-secondary">{signal.type.replace("_", " ")}</span></span>
                <span>·</span>
                <span>Station: <span className="font-mono text-text-secondary">{signal.station_code}</span></span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <CircleDot className="h-3 w-3" style={{ color: ASPECT_COLORS[signal.aspect] }} />
                <span className="text-xs capitalize" style={{ color: ASPECT_COLORS[signal.aspect] }}>{signal.aspect}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card text-center">
      <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
