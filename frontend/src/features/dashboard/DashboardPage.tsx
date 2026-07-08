import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Signal,
  Train,
  Gauge,
  CloudRain,
  Map,
  Wrench,
  BrainCircuit,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [trains, setTrains] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);

  // Poll simulation engine data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stRes, trRes, alRes, mtRes, weRes] = await Promise.all([
          api.get("/api/dashboard/stats"),
          api.get("/api/trains"),
          api.get("/api/alerts"),
          api.get("/api/maintenance"),
          api.get("/api/weather"),
        ]);
        setStats(stRes.data.data);
        setTrains(trRes.data.data);
        setAlerts(alRes.data.data);
        setMaintenance(mtRes.data.data);
        setWeather(weRes.data.data);
      } catch (err) {
        console.error("Dashboard poll failed", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000); // 1-second simulation tick
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-10 w-10 animate-pulse text-accent" />
          <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Initializing Command Centre...</p>
        </div>
      </div>
    );
  }

  const activeTrains = trains.filter((t) => t.status === "running");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Operations Command Centre</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
            <Map className="h-4 w-4" />
            {stats.corridor} Sector
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-surface p-2 pr-4 shadow-sm">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-status-success"></span>
          </div>
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-primary">
            Live Telemetry Active
          </span>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Active Trains"
          value={stats.active_trains}
          icon={Train}
          status="info"
          detail={`${activeTrains.length} on route`}
        />
        <KPICard
          title="Signal Health"
          value={`${stats.signal_health}%`}
          icon={Signal}
          status={stats.signal_health > 90 ? "success" : "warning"}
          detail={`${stats.total_stations} stations active`}
        />
        <KPICard
          title="On-Time Perf"
          value={`${stats.on_time_performance}%`}
          icon={Gauge}
          status={stats.on_time_performance >= 90 ? "success" : "warning"}
          detail="Network wide"
        />
        <KPICard
          title="Critical Alerts"
          value={stats.critical_alerts}
          icon={AlertTriangle}
          status={stats.critical_alerts > 0 ? "danger" : "success"}
          detail={stats.critical_alerts > 0 ? "Immediate action req." : "All systems normal"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {/* Left Column (Wider) */}
        <div className="space-y-4 lg:col-span-2 xl:col-span-3">
          
          {/* Live Trains Table */}
          <div className="card h-[400px] overflow-hidden flex flex-col">
            <div className="mb-4 flex items-center justify-between border-b border-border-primary pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                <h2 className="text-base font-semibold text-text-primary">Live Train Telemetry</h2>
              </div>
              <span className="rounded-full bg-status-info-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-status-info">
                {activeTrains.length} Tracking
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-bg-surface-hover text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Train</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Section</th>
                    <th className="px-4 py-3 font-medium">Speed</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {trains.map((train) => (
                    <tr key={train.id} className="transition-colors hover:bg-bg-surface-hover/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{train.number}</div>
                        <div className="text-xs text-text-muted">{train.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-bg-base px-2 py-1 text-[10px] font-semibold uppercase text-text-secondary border border-border-primary">
                          {train.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {train.current_route_id.replace("rt_", "").replace("_", " \u2192 ").toUpperCase()}
                      </td>
                      <td className="px-4 py-3 font-mono text-text-primary">
                        {Math.round(train.current_speed_kmh)} km/h
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-base border border-border-primary">
                            <div
                              className={`h-full rounded-full ${train.status === 'stopped' ? 'bg-status-warning' : 'bg-status-success'}`}
                              style={{ width: `${train.progress_pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-text-muted">
                            {Math.round(train.progress_pct)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {train.delay_minutes > 0 ? (
                          <span className="flex items-center gap-1 font-mono text-status-danger">
                            <Clock className="h-3 w-3" />+{train.delay_minutes}m
                          </span>
                        ) : (
                          <span className="text-status-success text-xs font-medium uppercase">On Time</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI & Events Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card h-64">
              <div className="mb-4 flex items-center gap-2 border-b border-border-primary pb-3">
                <BrainCircuit className="h-5 w-5 text-purple-400" />
                <h2 className="text-base font-semibold text-text-primary">AI Operations Advisor</h2>
              </div>
              <div className="space-y-3 overflow-y-auto">
                <div className="flex gap-3 rounded-md bg-purple-500/10 p-3 border border-purple-500/20">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-purple-200">Optimal Routing Suggested</p>
                    <p className="mt-1 text-xs text-purple-300/70">
                      Rerouting Train 12805 via loop line at KZJ will improve network flow by 4.2%.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-md bg-bg-surface-hover p-3 border border-border-primary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Signal Network Stable</p>
                    <p className="mt-1 text-xs text-text-muted">
                      No predictive failures detected in the next 12 hours based on historical telemetry.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card h-64 flex flex-col">
              <div className="mb-4 flex items-center justify-between border-b border-border-primary pb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-status-warning" />
                  <h2 className="text-base font-semibold text-text-primary">Active Maintenance</h2>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {maintenance.length > 0 ? maintenance.map((task) => (
                  <div key={task.id} className="flex justify-between items-center border-l-2 border-status-warning pl-3 py-1">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{task.type}</p>
                      <p className="text-xs font-mono text-text-muted mt-0.5">{task.location}</p>
                    </div>
                    <span className="rounded bg-status-warning/10 px-2 py-1 text-[10px] uppercase font-bold text-status-warning">
                      {task.status}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-text-muted italic">No active maintenance.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Narrower) */}
        <div className="space-y-4">
          
          {/* Weather Panel */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2 border-b border-border-primary pb-3">
              <CloudRain className="h-5 w-5 text-status-info" />
              <h2 className="text-base font-semibold text-text-primary">Corridor Conditions</h2>
            </div>
            {weather ? (
              <div className="space-y-3">
                <div className="rounded bg-status-info/10 p-3 text-center border border-status-info/20">
                  <p className="text-xs uppercase tracking-widest text-status-info font-bold">Network Wide</p>
                  <p className="mt-1 font-medium text-text-primary">{weather.global_status}</p>
                </div>
                <div className="space-y-2 pt-2">
                  {Object.entries(weather.stations).map(([code, data]: [string, any]) => (
                    <div key={code} className="flex items-center justify-between">
                      <span className="font-mono text-xs text-text-secondary">{code}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted">{data.condition}</span>
                        <span className="font-mono text-sm font-medium text-text-primary">{data.temp_c}°C</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Loading weather data...</p>
            )}
          </div>

          {/* Critical Alerts Feed */}
          <div className="card flex-1 min-h-[300px]">
            <div className="mb-4 flex items-center justify-between border-b border-border-primary pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-status-danger" />
                <h2 className="text-base font-semibold text-text-primary">System Alerts</h2>
              </div>
            </div>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-md border border-border-primary p-3 bg-bg-base">
                    <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-status-success opacity-50 mb-2" />
                  <p className="text-sm text-text-muted">No active alerts.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  status,
  detail,
}: {
  title: string;
  value: string | number;
  icon: any;
  status: "success" | "warning" | "danger" | "info";
  detail: string;
}) {
  const colors = {
    success: "text-status-success",
    warning: "text-status-warning",
    danger: "text-status-danger",
    info: "text-accent",
  };

  return (
    <div className="card flex items-center justify-between p-4 transition-colors hover:border-border-strong">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{title}</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-text-primary">{value}</p>
        <p className="mt-1 text-[10px] font-medium uppercase text-text-secondary">{detail}</p>
      </div>
      <div className={`rounded-full bg-bg-base p-3 border border-border-primary`}>
        <Icon className={`h-6 w-6 ${colors[status]}`} strokeWidth={1.5} />
      </div>
    </div>
  );
}
