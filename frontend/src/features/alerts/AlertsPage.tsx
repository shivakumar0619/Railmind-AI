import { useState } from "react";
import { Bell, CheckCircle2, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface AlertData {
  id: string;
  severity: string;
  title: string;
  description: string;
  station_code: string;
  created_at: string;
  acknowledged: boolean;
  resolved: boolean;
}

const SEVERITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "text-status-danger", bg: "bg-status-danger-muted", border: "border-status-danger/30" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-400/30" },
  medium: { color: "text-status-warning", bg: "bg-status-warning-muted", border: "border-status-warning/30" },
  low: { color: "text-status-info", bg: "bg-status-info-muted", border: "border-status-info/30" },
  info: { color: "text-text-muted", bg: "bg-bg-surface-hover", border: "border-border-primary" },
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<string>("all");

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get("/api/alerts")).data.data,
    refetchInterval: 2000,
  });

  const alerts = alertsData || [];

  const filtered = filter === "all" ? alerts : filter === "active" ? alerts.filter((a: AlertData) => !a.resolved) : alerts.filter((a: AlertData) => a.severity === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Alerts</h1>
          <p className="mt-1 text-sm text-text-secondary">Operational alerts and notifications</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-status-danger-muted px-3 py-1.5">
          <Bell className="h-4 w-4 text-status-danger" />
          <span className="text-sm font-medium text-status-danger">{alerts.filter((a: AlertData) => !a.resolved).length} active</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "active", "critical", "high", "medium", "low"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === f ? "bg-accent text-white" : "bg-bg-surface-hover text-text-secondary hover:text-text-primary"}`}>
            {f}
          </button>
        ))}
      </div>

      {isLoading && !alertsData ? (
        <div className="flex justify-center p-12">
          <Activity className="h-8 w-8 animate-pulse text-accent" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert: AlertData) => {
            const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
            return (
              <div key={alert.id} className={`rounded-xl border p-4 transition-colors ${s.border} ${alert.resolved ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${s.color} ${s.bg}`}>{alert.severity}</span>
                      {!alert.acknowledged && <span className="rounded bg-status-danger px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>}
                      {alert.resolved && <span className="flex items-center gap-1 text-[10px] text-status-success"><CheckCircle2 className="h-3 w-3" /> Resolved</span>}
                    </div>
                    <h3 className="mt-1.5 text-sm font-semibold text-text-primary">{alert.title}</h3>
                    <p className="mt-1 text-xs text-text-secondary">{alert.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                      <span>Station: <span className="font-mono text-text-secondary">{alert.station_code}</span></span>
                      <span>·</span>
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button className="shrink-0 rounded-lg border border-border-primary px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary">
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-status-success" />
              <p className="mt-3 text-sm text-text-secondary">No alerts match the current filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
