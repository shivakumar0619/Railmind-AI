import { useQuery } from "@tanstack/react-query";
import { Zap, Map as MapIcon, Navigation } from "lucide-react";
import TrackMap from "./components/TrackMap";
import { api } from "../../lib/api";

export default function DigitalTwinPage() {
  const { data: stationsData, isLoading: loadingStations } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => (await api.get("/api/stations")).data.data,
    refetchInterval: 60000,
  });

  const { data: routesData, isLoading: loadingRoutes } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => (await api.get("/api/routes")).data.data,
    refetchInterval: 10000,
  });

  const { data: signalsData, isLoading: loadingSignals } = useQuery({
    queryKey: ["signals"],
    queryFn: async () => (await api.get("/api/signals")).data.data,
    refetchInterval: 1000,
  });

  const { data: trainsData, isLoading: loadingTrains } = useQuery({
    queryKey: ["trains"],
    queryFn: async () => (await api.get("/api/trains")).data.data,
    refetchInterval: 1000,
  });

  const loading = (loadingStations || loadingRoutes || loadingSignals || loadingTrains) && !stationsData;

  const stations = stationsData || [];
  const routes = routesData || [];
  const signals = signalsData || [];
  const trains = trainsData || [];

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-6rem)] font-mono">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center shrink-0 border-b border-border-primary pb-2">
        <div className="flex items-center gap-3">
          <MapIcon className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-text-primary">Digital Twin OCC</h1>
            <p className="text-[10px] uppercase text-text-secondary">High-Fidelity Topology & Live Telemetry Map</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 rounded bg-bg-surface border border-border-primary px-3 py-1.5 shadow-sm">
            <span className="text-text-muted uppercase font-bold">TRN Count:</span>
            <span className="font-bold text-text-primary">{trains.filter((t: any) => t.status !== "completed").length}</span>
          </div>
          <div className="flex items-center gap-2 rounded bg-status-success-muted border border-status-success/30 px-3 py-1.5 text-status-success shadow-sm">
            <Zap className="h-4 w-4 animate-pulse" />
            <span className="font-bold uppercase tracking-wider">Live Stream</span>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative w-full overflow-hidden border-2 border-border-primary bg-bg-base shadow-xl">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-base z-10">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent mb-4" />
            <p className="text-xs uppercase font-bold text-text-secondary tracking-widest animate-pulse">Initialising GIS Subsystem...</p>
          </div>
        ) : (
          <TrackMap 
            stations={stations}
            routes={routes}
            signals={signals}
            trains={trains}
          />
        )}
      </div>
    </div>
  );
}
