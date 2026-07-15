import { useState } from "react";
import { Building2, Zap, Search, Hash, Type, Layers, Map, Activity, ShieldCheck, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import FilterBar, { FilterConfig } from "../../components/shared/FilterBar";

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
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data: stationsData, isLoading } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => (await api.get("/api/stations")).data.data,
    refetchInterval: 10000,
  });

  const stations: Station[] = stationsData || [];

  const filterConfigs: FilterConfig[] = [
    { id: "search", label: "Station", type: "search", placeholder: "Search Code or Name" },
    { id: "division", label: "Division", type: "select", options: [
      { label: "Secunderabad (SC)", value: "SC" },
      { label: "Hyderabad (HYB)", value: "HYB" },
      { label: "Vijayawada (BZA)", value: "BZA" },
      { label: "Guntur (GNT)", value: "GNT" },
      { label: "Guntakal (GTL)", value: "GTL" },
      { label: "Nanded (NED)", value: "NED" },
    ]},
    { id: "zone", label: "Zone", type: "select", options: [
      { label: "SCR", value: "SCR" }
    ]},
    { id: "platforms", label: "Platforms", type: "select", options: [
      { label: "Major (>=6)", value: "major" },
      { label: "Minor (<6)", value: "minor" }
    ]},
    { id: "status", label: "Status", type: "select", options: [
      { label: "Operational", value: "operational" },
      { label: "Maintenance", value: "maintenance" },
      { label: "Closed", value: "closed" },
    ]}
  ];

  const filteredStations = stations.filter((s: Station) => {
    if (filters.search && !(s.name || "").toLowerCase().includes(filters.search.toLowerCase()) && !(s.code || "").toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.division && s.division !== filters.division) return false;
    if (filters.status && s.status !== filters.status) return false;
    if (filters.zone && s.zone !== filters.zone) return false;
    if (filters.platforms) {
       if (filters.platforms === 'major' && (s.platforms || 0) < 6) return false;
       if (filters.platforms === 'minor' && (s.platforms || 0) >= 6) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Stations</h1>
          <p className="mt-1 text-sm text-text-secondary">Secunderabad–Kazipet–Vijayawada corridor</p>
        </div>
      </div>

      <FilterBar configs={filterConfigs} onFilterChange={setFilters} />

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
                            style={{ width: `${station.occupancy ?? 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-text-secondary">{station.occupancy ?? 0}%</span>
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
