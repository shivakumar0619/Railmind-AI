import { useQuery } from "@tanstack/react-query";
import { Train as TrainIcon, Clock, Gauge, MapPin, Activity, Inbox, Hash, Zap } from "lucide-react";
import { api } from "../../lib/api";

interface TrainData {
  id: string;
  number: string;
  name: string;
  type: string;
  status: string;
  current_speed_kmh: number;
  current_station: string;
  next_station: string;
  delay_minutes: number;
  current_route_id: string;
  progress_pct: number;
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  running: { label: "Running", color: "text-status-success", bg: "bg-status-success-muted/20", border: "border-status-success/30" },
  waiting: { label: "Waiting", color: "text-status-danger", bg: "bg-status-danger-muted/20", border: "border-status-danger/30" },
  at_station: { label: "Dwelling", color: "text-status-info", bg: "bg-status-info-muted/20", border: "border-status-info/30" },
  completed: { label: "Terminated", color: "text-text-muted", bg: "bg-bg-surface-hover", border: "border-border-primary" },
};

export default function TrainsPage() {
  const { data: trainsData, isLoading } = useQuery({
    queryKey: ["trains"],
    queryFn: async () => (await api.get("/api/trains")).data.data,
    refetchInterval: 1000,
  });

  const trains = trainsData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Fleet Tracking</h1>
          <p className="mt-1 text-sm text-text-secondary">Live telemetry stream for all active rolling stock</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5">
          <TrainIcon className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold text-accent">{trains.filter((t: any) => t.status !== "completed").length} Active</span>
        </div>
      </div>

      {isLoading && !trainsData ? (
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
                  <div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5"/> Train No.</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">Name / Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5"/> Speed / Prg</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/> Location</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> Delay</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5"/> Status</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 opacity-50" />
                      <p>No active trains found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                trains.map((train: TrainData) => {
                  const s = STATUS_STYLES[train.status] || STATUS_STYLES.completed;
                  return (
                    <tr key={train.id} className="group transition-colors hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span className="font-mono text-base font-bold text-text-primary">{train.number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{train.name}</div>
                        <div className="text-[10px] text-text-muted uppercase mt-0.5">{train.type.replace("_", " ")}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-sm text-text-secondary">{Math.round(train.current_speed_kmh || 0)} km/h</span>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                            <div 
                              className={`h-full rounded-full ${train.status === 'waiting' ? 'bg-status-danger' : 'bg-accent'}`} 
                              style={{ width: `${Math.min(100, train.progress_pct || 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-muted w-10 uppercase text-[9px]">Route</span>
                            <span className="font-mono text-text-secondary">{train.current_route_id ? train.current_route_id.replace("rt_", "").toUpperCase() : "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-muted w-10 uppercase text-[9px]">Target</span>
                            <span className="font-mono text-text-secondary font-bold">{train.next_station || train.current_station}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {train.delay_minutes > 0 ? (
                          <span className="font-mono text-status-warning font-bold">+{train.delay_minutes}m</span>
                        ) : (
                          <span className="font-mono text-status-success">0m</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border uppercase tracking-wider ${s.color} ${s.bg} ${s.border}`}>
                          {s.label}
                        </span>
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
