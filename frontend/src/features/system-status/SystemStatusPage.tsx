import { useEffect, useState } from "react";
import { Activity, Server, Database, Map, Brain, Bell } from "lucide-react";

interface ComponentStatus {
  name: string;
  status: string;
  uptime: string;
}

interface SystemStatusData {
  data: ComponentStatus[];
  overall: string;
  timestamp: string;
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatusData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/system-status").then(r => r.json()).then(d => setStatus(d));
  }, []);

  const getIcon = (name: string) => {
    if (name.includes("API")) return Server;
    if (name.includes("Database")) return Database;
    if (name.includes("Map")) return Map;
    if (name.includes("Simulation")) return Brain;
    if (name.includes("Alert")) return Bell;
    return Activity;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">System Status</h1>
          <p className="mt-1 text-sm text-text-secondary">Platform health and uptime monitoring</p>
        </div>
        {status && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${status.overall === 'operational' ? 'bg-status-success-muted text-status-success' : 'bg-status-warning-muted text-status-warning'}`}>
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium capitalize">{status.overall}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {status?.data.map((comp, i) => {
          const Icon = getIcon(comp.name);
          return (
            <div key={i} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-bg-surface-hover p-2">
                  <Icon className="h-5 w-5 text-text-muted" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{comp.name}</h3>
                  <p className="text-xs text-text-muted">Uptime: {comp.uptime}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${comp.status === 'operational' ? 'bg-status-success' : 'bg-status-warning'}`} />
                <span className="text-xs font-medium capitalize text-text-secondary">{comp.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
