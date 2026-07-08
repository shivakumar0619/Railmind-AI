import { useEffect, useState } from "react";
import { Brain, Lightbulb, TrendingUp, AlertTriangle, Activity } from "lucide-react";
import { api } from "../../lib/api";

interface Insight {
  title: string;
  desc: string;
  type: string;
  severity: "success" | "warning" | "danger" | "info";
}

export default function AiInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get("/api/insights");
        setInsights(res.data.data);
        setLoading(false);
      } catch (e) {
        console.error("Insights poll failed", e);
      }
    };

    fetchInsights();
    const interval = setInterval(fetchInsights, 1000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    if (type === "routing") return TrendingUp;
    if (type === "maintenance") return AlertTriangle;
    if (type === "efficiency") return Lightbulb;
    return Brain;
  };

  const getColorStyles = (severity: string) => {
    switch (severity) {
      case "danger": return { color: "text-status-danger", bg: "bg-status-danger-muted", border: "border-status-danger/30" };
      case "warning": return { color: "text-status-warning", bg: "bg-status-warning-muted", border: "border-status-warning/30" };
      case "success": return { color: "text-status-success", bg: "bg-status-success-muted", border: "border-status-success/30" };
      default: return { color: "text-accent", bg: "bg-accent/20", border: "border-accent/30" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/20 p-2 text-accent">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">AI Insights</h1>
            <p className="mt-1 text-sm text-text-secondary">Predictive analytics and intelligent recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-status-success-muted border border-status-success/30 px-3 py-1.5 text-status-success shadow-sm">
          <Activity className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">Model Active</span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {insights.length > 0 ? (
            insights.map((insight, i) => {
              const Icon = getIcon(insight.type);
              const styles = getColorStyles(insight.severity);
              return (
                <div key={i} className={`card-interactive card flex flex-col justify-between border ${styles.border}`}>
                  <div>
                    <div className={`mb-4 w-fit rounded-lg p-3 ${styles.bg} ${styles.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-semibold text-text-primary">{insight.title}</h3>
                    <p className="text-sm text-text-secondary">{insight.desc}</p>
                  </div>
                  <button className={`mt-6 w-full rounded-md py-2 text-sm font-medium transition-colors ${styles.bg} ${styles.color} hover:opacity-80`}>
                    Take Action
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center border rounded-xl border-border-primary">
              <Brain className="mx-auto h-12 w-12 text-text-muted opacity-50" />
              <p className="mt-4 text-text-secondary">No AI insights generated yet. The model is analyzing network telemetry.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
