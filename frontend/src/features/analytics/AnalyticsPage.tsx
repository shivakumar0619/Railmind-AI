import { Activity, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"];
const SEVERITY_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#3b82f6" };

export default function AnalyticsPage() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/api/dashboard/analytics")).data.data,
    refetchInterval: 5000,
  });

  const analytics = analyticsData;

  if (isLoading && !analytics) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">System Analytics</h1>
          <p className="mt-1 text-sm text-text-secondary">Historical data and operational KPIs</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-bg-surface-hover px-4 py-2 text-sm text-text-primary hover:bg-border-primary">
          Export Report
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* On Time Performance Trend */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2 border-b border-border-primary pb-3">
            <LineChartIcon className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-text-primary">7-Day Punctuality Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.train_performance_7d}>
              <defs>
                <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fafafa" }} />
              <Area type="monotone" dataKey="on_time" stroke="#22c55e" fillOpacity={1} fill="url(#colorOnTime)" name="On Time %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Delay vs On Time Volume */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2 border-b border-border-primary pb-3">
            <Activity className="h-5 w-5 text-status-warning" />
            <h2 className="text-base font-semibold text-text-primary">Traffic Composition</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.train_performance_7d}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fafafa" }} />
              <Bar dataKey="on_time" stackId="a" fill="#22c55e" name="On Time" />
              <Bar dataKey="delayed" stackId="a" fill="#ef4444" name="Delayed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts Distribution */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2 border-b border-border-primary pb-3">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold text-text-primary">Incident Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.alerts_by_severity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" stroke="#71717a" fontSize={12} />
              <YAxis dataKey="severity" type="category" stroke="#71717a" fontSize={12} width={70} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fafafa" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {analytics.alerts_by_severity.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity.toLowerCase()] || "#71717a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Health Distribution */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2 border-b border-border-primary pb-3">
            <PieChartIcon className="h-5 w-5 text-purple-500" />
            <h2 className="text-base font-semibold text-text-primary">Signal Health Overview</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.signal_health_distribution}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {analytics.signal_health_distribution.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fafafa" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
