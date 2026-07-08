import { useEffect, useState } from "react";
import { Zap, Layers, Navigation } from "lucide-react";
import TrackMap from "./components/TrackMap";
import { api } from "../../lib/api";

export default function DigitalTwinPage() {
  const [data, setData] = useState<any>({
    stations: [],
    routes: [],
    signals: [],
    trains: []
  });
  const [loading, setLoading] = useState(true);

  // Poll simulation engine data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stRes, rtRes, sigRes, trRes] = await Promise.all([
          api.get("/api/stations"),
          api.get("/api/routes"),
          api.get("/api/signals"),
          api.get("/api/trains"),
        ]);
        setData({
          stations: stRes.data.data,
          routes: rtRes.data.data,
          signals: sigRes.data.data,
          trains: trRes.data.data,
        });
        setLoading(false);
      } catch (err) {
        console.error("Digital Twin poll failed", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000); // 1-second simulation tick
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Digital Twin</h1>
          <p className="mt-1 text-sm text-text-secondary">Live interactive representation of the railway network</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-status-success-muted border border-status-success/30 px-3 py-1.5 text-status-success shadow-sm">
          <Zap className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">Live Feed Active</span>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative w-full overflow-hidden rounded-xl border border-border-primary bg-bg-elevated shadow-lg">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-base/80 backdrop-blur-sm z-10">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-text-secondary">Synchronizing telemetry...</p>
          </div>
        ) : (
          <TrackMap 
            stations={data.stations}
            routes={data.routes}
            signals={data.signals}
            trains={data.trains}
          />
        )}
      </div>
    </div>
  );
}
