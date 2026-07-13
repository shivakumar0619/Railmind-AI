import { useQuery } from "@tanstack/react-query";
import { Wrench, CheckCircle2, Clock, AlertTriangle, Activity, MapPin, Inbox, ShieldAlert } from "lucide-react";
import { api } from "../../lib/api";

interface MaintenanceTask {
  id: string;
  type: string;
  station_code?: string;
  location?: string;
  status: string;
  urgency: string;
  due?: string;
  created_at?: string;
  block?: string;
  speed_restriction_kmh?: number;
}

export default function MaintenancePage() {
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => (await api.get("/api/maintenance")).data.data,
    refetchInterval: 10000,
  });

  const tasks = maintenanceData || [];

  return (
    <div className="space-y-6 font-mono text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-text-primary">Maintenance Operations</h1>
          <p className="mt-1 text-xs text-text-secondary uppercase">Track, Signal, and OHE Maintenance Logs</p>
        </div>
        <div className="flex items-center gap-2 rounded bg-bg-surface border border-border-primary px-3 py-1.5 shadow-sm">
          <Wrench className="h-4 w-4 text-text-muted" />
          <span className="font-bold text-text-primary">{tasks.length} Active Blocks</span>
        </div>
      </div>

      {isLoading && !maintenanceData ? (
        <div className="flex justify-center p-12">
          <Activity className="h-8 w-8 animate-pulse text-accent" />
        </div>
      ) : (
      <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Job ID / Type</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Speed Restriction</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="h-8 w-8 opacity-50 text-status-success" />
                      <p>No active maintenance blocks. Network is clear.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task: MaintenanceTask) => (
                  <tr key={task.id} className="group transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary">{task.type}</span>
                        <span className="text-[10px] text-text-muted">ID: {task.id.slice(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <MapPin className="h-3.5 w-3.5 text-text-muted" />
                        <span className="font-bold">{task.location || task.station_code || "Unknown"}</span>
                        {task.block && <span className="text-text-muted text-[10px]">({task.block})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {task.speed_restriction_kmh ? (
                        <span className="rounded bg-status-danger-muted/20 border border-status-danger/30 text-status-danger px-2 py-0.5 font-bold">
                          {task.speed_restriction_kmh} km/h
                        </span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-bg-surface-hover border border-border-primary px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold text-text-secondary">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <UrgencyBadge urgency={task.urgency} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  let color = "text-text-secondary";
  let border = "border-border-primary";
  let bg = "bg-bg-surface-hover";
  let icon = <Clock className="h-3 w-3 mr-1 inline" />;

  if (urgency?.toLowerCase() === "critical") {
    color = "text-status-danger";
    border = "border-status-danger/30";
    bg = "bg-status-danger-muted/20";
    icon = <ShieldAlert className="h-3 w-3 mr-1 inline" />;
  } else if (urgency?.toLowerCase() === "high") {
    color = "text-status-warning";
    border = "border-status-warning/30";
    bg = "bg-status-warning-muted/20";
    icon = <AlertTriangle className="h-3 w-3 mr-1 inline" />;
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${color} ${bg} ${border}`}>
      {icon}{urgency}
    </span>
  );
}
