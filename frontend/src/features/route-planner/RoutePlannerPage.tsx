import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowRight, Navigation2, Clock, Map as MapIcon, Train, AlertTriangle } from "lucide-react";

// Simplified API fetchers
const fetchStations = async () => {
  const res = await fetch("/api/stations");
  if (!res.ok) throw new Error("Failed to fetch stations");
  return res.json();
};

const planRoute = async (origin: string, destination: string, via: string, preference: string) => {
  const params = new URLSearchParams({ origin, destination, preference });
  if (via) params.append("via", via);
  const res = await fetch(`/api/routes/plan?${params.toString()}`);
  if (!res.ok) throw new Error("Route not found");
  return res.json();
};

export default function RoutePlannerPage() {
  const [origin, setOrigin] = useState("SC");
  const [destination, setDestination] = useState("BZA");
  const [via, setVia] = useState("");
  const [preference, setPreference] = useState("fastest");
  const [trainType, setTrainType] = useState("Express");
  
  const [planResult, setPlanResult] = useState<any>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState("");

  const { data: stationsData, isLoading: isLoadingStations } = useQuery({
    queryKey: ["stations"],
    queryFn: fetchStations,
  });

  const stations = stationsData?.data || [];

  const handlePlan = async () => {
    if (!origin || !destination) return;
    setIsPlanning(true);
    setError("");
    try {
      const data = await planRoute(origin, destination, via, preference);
      setPlanResult(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to calculate route");
      setPlanResult(null);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Route Planner</h1>
        <p className="text-sm text-text-secondary">Calculate optimal paths across the SCR network using Dijkstra's algorithm</p>
      </div>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="rounded-xl border border-border-primary bg-bg-surface p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
              <Navigation2 className="h-5 w-5 text-accent" />
              Journey Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Origin</label>
                <select 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full rounded-lg border border-border-primary bg-bg-primary p-2.5 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="">Select Origin...</option>
                  {stations.map((s: any) => (
                    <option key={`orig-${s.code}`} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Via (Optional)</label>
                <select 
                  value={via}
                  onChange={(e) => setVia(e.target.value)}
                  className="w-full rounded-lg border border-border-primary bg-bg-primary p-2.5 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="">Direct Route</option>
                  {stations.map((s: any) => (
                    <option key={`via-${s.code}`} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Destination</label>
                <select 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-lg border border-border-primary bg-bg-primary p-2.5 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="">Select Destination...</option>
                  {stations.map((s: any) => (
                    <option key={`dest-${s.code}`} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">Train Type</label>
                  <select 
                    value={trainType}
                    onChange={(e) => setTrainType(e.target.value)}
                    className="w-full rounded-lg border border-border-primary bg-bg-primary p-2.5 text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option>Shatabdi</option>
                    <option>Superfast</option>
                    <option>Express</option>
                    <option>Passenger</option>
                    <option>Freight</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">Optimization</label>
                  <select 
                    value={preference}
                    onChange={(e) => setPreference(e.target.value)}
                    className="w-full rounded-lg border border-border-primary bg-bg-primary p-2.5 text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option value="fastest">Fastest Time</option>
                    <option value="shortest">Shortest Distance</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handlePlan}
                disabled={isPlanning || !origin || !destination}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {isPlanning ? "Calculating..." : "Generate Route Plan"}
              </button>
              
              {error && (
                <div className="mt-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <div className="flex-1 rounded-xl border border-border-primary bg-bg-surface p-6 shadow-sm">
            {!planResult ? (
              <div className="flex h-full flex-col items-center justify-center text-text-muted">
                <MapIcon className="mb-4 h-16 w-16 opacity-20" />
                <p>Select origin and destination to generate a route plan.</p>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <h3 className="mb-6 text-xl font-semibold text-text-primary">Route Summary</h3>
                
                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border-primary bg-bg-primary p-4">
                    <div className="flex items-center gap-2 text-text-secondary mb-1">
                      <MapPin className="h-4 w-4" /> Distance
                    </div>
                    <div className="text-2xl font-bold text-text-primary">{planResult.distance} km</div>
                  </div>
                  <div className="rounded-lg border border-border-primary bg-bg-primary p-4">
                    <div className="flex items-center gap-2 text-text-secondary mb-1">
                      <Clock className="h-4 w-4" /> Est. Time (Normal)
                    </div>
                    <div className="text-2xl font-bold text-text-primary">{Math.round(planResult.eta_minutes / 60)}h {planResult.eta_minutes % 60}m</div>
                  </div>
                  <div className="rounded-lg border border-border-primary bg-bg-primary p-4">
                    <div className="flex items-center gap-2 text-text-secondary mb-1">
                      <Train className="h-4 w-4" /> Path Segments
                    </div>
                    <div className="text-2xl font-bold text-text-primary">{planResult.route_ids.length}</div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <h4 className="mb-4 font-medium text-text-secondary">Station Sequence</h4>
                  <div className="relative border-l-2 border-accent/30 ml-3 pl-6 space-y-6">
                    {planResult.path.map((stationCode: string, idx: number) => {
                      const st = stations.find((s: any) => s.code === stationCode) || { name: stationCode };
                      const isEnd = idx === 0 || idx === planResult.path.length - 1;
                      
                      return (
                        <div key={`${stationCode}-${idx}`} className="relative">
                          <div className={`absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full ${isEnd ? 'bg-accent' : 'bg-bg-surface border-2 border-accent'}`}></div>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-text-primary">{stationCode}</span>
                              <span className="ml-2 text-sm text-text-secondary">{st.name}</span>
                            </div>
                            {idx < planResult.path.length - 1 && (
                              <div className="text-xs text-text-muted">
                                {planResult.route_ids[idx]}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
