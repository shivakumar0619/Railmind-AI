import { useState } from "react";
import { Building2, Zap, Search, Hash, Type, Layers, Map, Activity, ShieldCheck, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

interface Station {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  platforms: number;
  is_junction: boolean;
  zone: string;
  division: string;
  km: number;
  status: string;
  electrified: boolean;
  occupancy?: number;
}

export default function StationsPage() {
  const { data: stationsData, isLoading } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => (await api.get("/api/stations")).data.data,
    refetchInterval: 10000,
  });

  const stations = stationsData || [];

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Stations</h1>
          <p className="mt-1 text-sm text-text-secondary">Secunderabad–Kazipet–Vijayawada corridor</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search stations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-border-primary bg-bg-elevated/50 py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent backdrop-blur-sm transition-all"
          />
        </div>
      </div>

      {isLoading && !stationsData ? (
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
                  <div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5"/> Code</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Type className="h-3.5 w-3.5"/> Name</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5"/> Platforms</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Map className="h-3.5 w-3.5"/> Zone</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5"/> Division</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5"/> Occupancy</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5"/> Status</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 opacity-50" />
                      <p>No stations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStations.map((station) => (
                  <tr key={station.id} className="group transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs font-medium text-text-secondary border border-white/10 group-hover:border-white/20 transition-colors">{station.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{station.name}</span>
                        {station.is_junction && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent border border-accent/20">JN</span>}
                        {station.electrified && <Zap className="h-3 w-3 text-status-warning" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{station.platforms}</td>
                    <td className="px-4 py-3 text-text-secondary">{station.zone || "SCR"}</td>
                    <td className="px-4 py-3 text-text-secondary">{station.division}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                          <div 
                            className="h-full rounded-full bg-accent" 
                            style={{ width: `${station.occupancy || Math.floor(Math.random() * 60 + 20)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-text-secondary">{station.occupancy || Math.floor(Math.random() * 60 + 20)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={station.status} />
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    operational: { label: "Operational", color: "text-status-success", bg: "bg-status-success-muted/20", border: "border-status-success/30" },
    maintenance: { label: "Maintenance", color: "text-status-warning", bg: "bg-status-warning-muted/20", border: "border-status-warning/30" },
    closed: { label: "Closed", color: "text-status-danger", bg: "bg-status-danger-muted/20", border: "border-status-danger/30" },
  };
  const s = map[status?.toLowerCase()] || map.operational;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${s.color} ${s.bg} ${s.border}`}>{s.label}</span>;
}
