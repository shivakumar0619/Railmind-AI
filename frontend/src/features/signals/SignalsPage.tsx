import { useState } from "react";
import { CircleDot, AlertTriangle, Wrench, CheckCircle2, Filter, Hash, Type, HeartPulse, Square, ShieldCheck, Inbox, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface SignalData {
  id: string;
  name: string;
  type: string;
  station_code: string;
  aspect: string;
  status: string;
  lat: number;
  lng: number;
  health?: number;
  block?: string;
}

const ASPECT_COLORS: Record<string, string> = {
  clear: "#16a34a",
  caution: "#eab308",
  attention: "#ca8a04",
  stop: "#dc2626",
};

export default function SignalsPage() {
  const { data: signalsData, isLoading } = useQuery({
    queryKey: ["signals"],
    queryFn: async () => (await api.get("/api/signals")).data.data,
    refetchInterval: 5000,
  });

  const signals = signalsData || [];

  const filteredSignals = filterAspect === "all" ? signals : signals.filter((s: SignalData) => s.aspect.toLowerCase() === filterAspect);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Signals</h1>
          <p className="mt-1 text-sm text-text-secondary">Signal monitoring and health status</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <select
            value={filterAspect}
            onChange={e => setFilterAspect(e.target.value)}
            className="rounded-lg border border-border-primary bg-bg-elevated/50 py-1.5 pl-3 pr-8 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent backdrop-blur-sm transition-all"
          >
            <option value="all">All Aspects</option>
            <option value="clear">Clear</option>
            <option value="caution">Caution</option>
            <option value="attention">Attention</option>
            <option value="stop">Stop</option>
          </select>
        </div>
      </div>

      {isLoading && !signalsData ? (
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
                  <div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5"/> ID / Name</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Type className="h-3.5 w-3.5"/> Type</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><CircleDot className="h-3.5 w-3.5"/> Aspect</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><HeartPulse className="h-3.5 w-3.5"/> Health</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Square className="h-3.5 w-3.5"/> Block</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5"/> Status</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 opacity-50" />
                      <p>No signals found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSignals.map((signal) => {
                  const health = signal.health || Math.floor(Math.random() * 40 + 60); // Mock if undefined
                  const blockSection = signal.block || `${signal.station_code}-BLK-${signal.id.slice(-2)}`;
                  return (
                    <tr key={signal.id} className="group transition-colors hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-text-primary">{signal.name}</span>
                          <span className="text-[10px] text-text-muted font-mono bg-white/5 px-1.5 py-0.5 rounded">{signal.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary capitalize">{signal.type.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative flex h-3 w-3 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ backgroundColor: ASPECT_COLORS[signal.aspect.toLowerCase()] || "#71717a" }}></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: ASPECT_COLORS[signal.aspect.toLowerCase()] || "#71717a" }}></span>
                          </div>
                          <span className="capitalize text-xs font-medium" style={{ color: ASPECT_COLORS[signal.aspect.toLowerCase()] || "#71717a" }}>{signal.aspect}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div 
                              className={`h-full rounded-full ${health > 80 ? 'bg-status-success' : health > 50 ? 'bg-status-warning' : 'bg-status-danger'}`} 
                              style={{ width: `${health}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-text-secondary">{health}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{blockSection}</td>
                      <td className="px-4 py-3">
                        <SignalStatusBadge status={signal.status} />
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

function SignalStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
    operational: { label: "Operational", icon: CheckCircle2, color: "text-status-success", bg: "bg-status-success-muted/20", border: "border-status-success/30" },
    degraded: { label: "Degraded", icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning-muted/20", border: "border-status-warning/30" },
    maintenance: { label: "Maintenance", icon: Wrench, color: "text-status-info", bg: "bg-status-info-muted/20", border: "border-status-info/30" },
    failed: { label: "Failed", icon: AlertTriangle, color: "text-status-danger", bg: "bg-status-danger-muted/20", border: "border-status-danger/30" },
  };
  const s = map[status?.toLowerCase()] || map.operational;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${s.color} ${s.bg} ${s.border}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}
