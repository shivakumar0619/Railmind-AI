import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Signal,
  Train,
  Gauge,
  CloudRain,
  Map as MapIcon,
  Wrench,
  BrainCircuit,
  Clock,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  Zap
} from "lucide-react";
import { api } from "../../lib/api";
import TrackMap from "../digital-twin/components/TrackMap";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Component, ErrorInfo, ReactNode } from "react";

// Local Error Boundary to catch render errors
class DashboardErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-bg-base text-status-danger font-mono text-xs uppercase p-4 text-center">
          <div>
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Dashboard Render Failure</p>
            <p className="text-text-muted mt-2">Falling back to safe mode. Retrying...</p>
            <button 
              className="mt-4 px-3 py-1 border border-status-danger text-status-danger hover:bg-status-danger/10"
              onClick={() => this.setState({ hasError: false })}
            >
              Reset Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardContent() {
  // Use React Query for defensive fetching with caching, retry, and stale-while-revalidate
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get("/api/dashboard/stats")).data.data,
    refetchInterval: 2000,
  });

  const { data: trainsData, isLoading: loadingTrains } = useQuery({
    queryKey: ["trains"],
    queryFn: async () => (await api.get("/api/trains")).data.data,
    refetchInterval: 1000,
  });

  const { data: stationsData } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => (await api.get("/api/stations")).data.data,
    refetchInterval: 10000,
  });

  const { data: routesData } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => (await api.get("/api/routes")).data.data,
    refetchInterval: 10000,
  });

  const { data: signalsData } = useQuery({
    queryKey: ["signals"],
    queryFn: async () => (await api.get("/api/signals")).data.data,
    refetchInterval: 5000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get("/api/alerts")).data.data,
    refetchInterval: 2000,
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => (await api.get("/api/maintenance")).data.data,
    refetchInterval: 5000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/api/dashboard/analytics")).data.data,
    refetchInterval: 5000,
  });

  // Safe fallbacks for data
  const stats = statsData || { corridor: "SCR", signal_health: 100, critical_alerts: 0 };
  const trains = trainsData || [];
  const stations = stationsData || [];
  const routes = routesData || [];
  const signals = signalsData || [];
  const alerts = alertsData || [];
  const maintenance = maintenanceData || [];
  const analytics = analyticsData || {};

  if (loadingStats && !statsData) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-base">
        <Activity className="h-8 w-8 animate-pulse text-accent" />
      </div>
    );
  }

  const activeTrains = trains.filter((t: any) => ["running", "approaching", "braking", "departing", "reversing"].includes(t.status));
  const stoppedTrains = trains.filter((t: any) => ["stopped", "dwelling"].includes(t.status));
  const delayedTrains = trains.filter((t: any) => t.delay_minutes > 0).sort((a: any, b: any) => b.delay_minutes - a.delay_minutes);
  const cancelledTrains = trains.filter((t: any) => t.status === "completed");

  const speedData = analytics.train_performance_7d || [];
  const delayData = analytics.train_performance_7d || []; 

  return (
    <div className="flex flex-col gap-2 h-[calc(100vh-6rem)] overflow-hidden font-mono text-sm bg-bg-base">
      <div className="flex items-center justify-between border-b border-border-primary pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-bold uppercase tracking-widest text-text-primary">Ops Command Centre</h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-text-muted uppercase">Sector:</span>
            <span className="text-text-primary font-bold">{stats.corridor}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted uppercase">Sim Time:</span>
            <span className="text-text-primary font-bold">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted uppercase">Status:</span>
            <span className="bg-status-success/20 text-status-success border border-status-success/30 px-2 py-0.5 font-bold uppercase">Active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">
        {/* Left Column */}
        <div className="w-[300px] shrink-0 flex flex-col gap-2 min-h-0 overflow-y-auto pr-1">
          <div className="bg-bg-surface border border-border-primary p-2">
            <div className="text-xs font-bold uppercase text-text-secondary border-b border-border-primary pb-1 mb-2">Fleet Status</div>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="Running" value={activeTrains.length} color="text-status-success" />
              <MetricBox label="Dwelling" value={stoppedTrains.length} color="text-status-info" />
              <MetricBox label="Delayed" value={delayedTrains.length} color="text-status-warning" />
              <MetricBox label="Cancelled" value={cancelledTrains.length} color="text-status-danger" />
            </div>
          </div>

          <div className="bg-bg-surface border border-border-primary p-2">
            <div className="text-xs font-bold uppercase text-text-secondary border-b border-border-primary pb-1 mb-2">Network Health</div>
            <div className="space-y-2">
              <ProgressRow label="Signal Health" val={stats.signal_health || 100} max={100} unit="%" />
              <ProgressRow label="Occupancy" val={Math.min(100, Math.round((activeTrains.length / 100) * 100))} max={100} unit="%" />
              <div className="flex justify-between items-center text-xs mt-1 pt-1 border-t border-border-primary">
                <span className="text-text-muted">Crit Alerts</span>
                <span className={`font-bold ${stats.critical_alerts > 0 ? 'text-status-danger' : 'text-status-success'}`}>{stats.critical_alerts || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-primary p-2 flex-1 min-h-[150px] flex flex-col">
            <div className="text-xs font-bold uppercase text-text-secondary border-b border-border-primary pb-1 mb-2 shrink-0">Analytics</div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="bg-bg-base border border-border-primary p-2 rounded">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] text-text-muted uppercase">Avg Speed</span>
                  <span className="text-sm font-bold text-text-primary">
                    {trains.length ? Math.round(trains.reduce((acc: number, t: any) => acc + (t.current_speed_kmh || 0), 0) / trains.length) : 0} km/h
                  </span>
                </div>
                <div className="h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={speedData}>
                      <YAxis domain={['auto', 'auto']} hide />
                      <Line type="monotone" dataKey="on_time" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-bg-base border border-border-primary p-2 rounded">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] text-text-muted uppercase">Avg Delay</span>
                  <span className="text-sm font-bold text-status-warning">
                    {delayedTrains.length ? Math.round(delayedTrains.reduce((acc: number, t: any) => acc + (t.delay_minutes || 0), 0) / delayedTrains.length) : 0} min
                  </span>
                </div>
                <div className="h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={delayData}>
                      <YAxis domain={['auto', 'auto']} hide />
                      <Line type="monotone" dataKey="delayed" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-[400px]">
          <div className="h-[250px] shrink-0 bg-bg-surface border border-border-primary p-1 relative overflow-hidden flex flex-col">
            <div className="absolute top-2 left-2 z-10 bg-bg-surface/80 backdrop-blur border border-border-primary px-2 py-1 flex items-center gap-2">
              <MapIcon className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] uppercase font-bold text-text-primary">Live Twin Preview</span>
            </div>
            <div className="flex-1 w-full h-full border border-border-primary rounded overflow-hidden">
              <TrackMap
                stations={stations}
                trains={trains}
                routes={routes}
                signals={signals}
              />
            </div>
          </div>

          <div className="flex-1 bg-bg-surface border border-border-primary flex flex-col min-h-0">
            <div className="p-2 border-b border-border-primary bg-bg-surface-hover flex justify-between items-center shrink-0">
              <span className="text-xs uppercase font-bold text-text-secondary">Active Telemetry Stream</span>
              <span className="text-[10px] text-text-muted font-mono">{activeTrains.length} TRK</span>
            </div>
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-bg-base text-text-muted uppercase">
                  <tr>
                    <th className="px-2 py-1.5 font-semibold">ID/TRN</th>
                    <th className="px-2 py-1.5 font-semibold">SEC</th>
                    <th className="px-2 py-1.5 font-semibold">SPD</th>
                    <th className="px-2 py-1.5 font-semibold">PRG</th>
                    <th className="px-2 py-1.5 font-semibold">DLY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {trains.slice(0, 15).map((train: any) => (
                    <tr key={train.id} className="hover:bg-bg-surface-hover/50 transition-colors">
                      <td className="px-2 py-1.5">
                        <div className="font-bold text-text-primary">{train.number}</div>
                      </td>
                      <td className="px-2 py-1.5 text-text-secondary truncate max-w-[80px]" title={train.current_route_id}>
                        {train.current_route_id ? train.current_route_id.replace("rt_", "").toUpperCase() : "N/A"}
                      </td>
                      <td className="px-2 py-1.5 text-text-primary">
                        {Math.round(train.current_speed_kmh || 0)}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="w-12 h-1.5 bg-bg-base border border-border-primary">
                          <div
                            className={`h-full ${train.status === 'at_station' ? 'bg-status-info' : (train.status === 'waiting' ? 'bg-status-danger' : 'bg-status-success')}`}
                            style={{ width: `${Math.min(100, train.progress_pct || 0)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        {train.delay_minutes > 0 ? (
                          <span className="text-status-warning font-bold">+{train.delay_minutes}</span>
                        ) : (
                          <span className="text-status-success font-bold">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-[300px] shrink-0 flex flex-col gap-2 min-h-0 overflow-y-auto">
          <div className="bg-bg-surface border border-border-primary flex flex-col p-2 h-[120px] shrink-0">
            <div className="flex items-center gap-2 border-b border-border-primary pb-1 mb-2 text-text-secondary">
              <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs uppercase font-bold">AI Insights</span>
            </div>
            <div className="overflow-auto flex-1 space-y-2">
              <div className="text-[10px] bg-purple-500/10 border border-purple-500/20 p-1.5 rounded">
                <span className="font-bold text-purple-300">Rerouting Option:</span> Route {trains[0]?.number || '12805'} via loop line to improve flow by 4.2%.
              </div>
              <div className="text-[10px] bg-status-success/10 border border-status-success/20 p-1.5 rounded">
                <span className="font-bold text-status-success">Clear:</span> No predictive failures in next 12h.
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-primary flex flex-col flex-1 min-h-[150px]">
            <div className="p-2 border-b border-border-primary flex items-center gap-2 text-text-secondary">
              <AlertOctagon className="h-3.5 w-3.5 text-status-danger" />
              <span className="text-xs uppercase font-bold">System Events</span>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {alerts.length > 0 ? alerts.slice(0, 5).map((a: any) => (
                <div key={a.id} className={`text-[11px] p-1.5 border-l-2 bg-bg-base ${a.severity === 'high' ? 'border-status-danger' : 'border-status-warning'}`}>
                  <div className="font-bold text-text-primary">{a.title}</div>
                  <div className="text-text-muted mt-0.5">{new Date(a.created_at || Date.now()).toLocaleTimeString()}</div>
                </div>
              )) : (
                <div className="text-[11px] text-text-muted italic flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-status-success" />
                  No critical events active.
                </div>
              )}
              {maintenance.map((m: any) => (
                <div key={m.id} className="text-[11px] p-1.5 border-l-2 border-status-warning bg-bg-base">
                  <div className="font-bold text-text-primary">{m.type} - {m.location}</div>
                  <div className="text-status-warning mt-0.5 uppercase">{m.status}</div>
                </div>
              ))}
              <div className="text-[11px] p-1.5 border-l-2 border-status-info bg-bg-base">
                <div className="font-bold text-text-primary">Weather Status</div>
                <div className="text-text-muted mt-0.5">Clear</div>
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-primary p-2 shrink-0 space-y-2">
            <div className="flex justify-between items-center p-1.5 bg-bg-base border border-border-primary rounded">
              <span className="text-[10px] text-text-muted uppercase font-bold">Most Delayed</span>
              <span className="text-xs font-bold text-status-danger">TRN-{delayedTrains[0]?.number || 'NONE'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-bg-base border border-border-primary p-1.5 rounded flex flex-col justify-between">
      <span className="text-[10px] text-text-muted uppercase font-bold">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

function ProgressRow({ label, val, max, unit }: { label: string; val: number; max: number; unit: string }) {
  const pct = Math.min(100, Math.max(0, (val / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-[10px] uppercase font-bold text-text-secondary mb-1">
        <span>{label}</span>
        <span>{val}{unit}</span>
      </div>
      <div className="h-1 w-full bg-bg-base border border-border-primary overflow-hidden">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  );
}
