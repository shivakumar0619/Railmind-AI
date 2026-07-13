import { useMemo } from "react";
import Map, { NavigationControl, FullscreenControl, Marker, Source, Layer, LayerProps } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface TrackMapProps {
  stations: any[];
  routes: any[];
  signals: any[];
  trains: any[];
}

export default function TrackMap({ stations, routes, signals, trains }: TrackMapProps) {
  // Compute GeoJSON for routes with accurate curved polylines
  const routesGeoJSON = useMemo(() => {
    const features = routes.map((route) => {
      // The backend now generates 'polyline' as [[lng, lat], [lng, lat], ...]
      const coords = route.polyline || [];
      return {
        type: "Feature",
        properties: {
          id: route.id,
          source_code: route.source_code,
          target_code: route.target_code,
          corridor: route.corridor || "Branch",
          congestion: route.congestion || "low"
        },
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      };
    }).filter(f => f.geometry.coordinates.length > 0);

    return {
      type: "FeatureCollection",
      features,
    };
  }, [routes]);

  const initialViewState = useMemo(() => {
    if (!stations.length) return { longitude: 79.5, latitude: 16.5, zoom: 6 };
    const minLng = Math.min(...stations.map((s) => s.lng));
    const maxLng = Math.max(...stations.map((s) => s.lng));
    const minLat = Math.min(...stations.map((s) => s.lat));
    const maxLat = Math.max(...stations.map((s) => s.lat));
    
    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: 6,
    };
  }, [stations]);

  // Track styling based on congestion/status
  const trackLayer: LayerProps = {
    id: "routes-line",
    type: "line",
    paint: {
      "line-color": [
        "match",
        ["get", "congestion"],
        "high", "#ef4444",
        "medium", "#f59e0b",
        "#4b5563"
      ],
      "line-width": ["match", ["get", "corridor"], "Mainline", 4, 2],
    },
    layout: {
      "line-join": "round",
      "line-cap": "round"
    }
  };

  const trackCasingLayer: LayerProps = {
    id: "routes-casing",
    type: "line",
    paint: {
      "line-color": "#18181b",
      "line-width": ["match", ["get", "corridor"], "Mainline", 6, 4],
    },
    layout: {
      "line-join": "round",
      "line-cap": "round"
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#09090b]">
      <Map
        initialViewState={initialViewState}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
        minZoom={4}
        maxZoom={18}
      >
        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" showCompass={false} />

        {/* Tracks Source */}
        <Source id="routes" type="geojson" data={routesGeoJSON as any}>
          <Layer {...trackCasingLayer} />
          <Layer {...trackLayer} />
        </Source>

        {/* Stations */}
        {stations.map((station) => (
          <Marker
            key={`station-${station.id || station.code}`}
            longitude={station.lng}
            latitude={station.lat}
            anchor="center"
          >
            <div className="relative group cursor-pointer flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#18181b] border-2 border-accent group-hover:bg-accent transition-colors shadow-lg z-20" />
              <div className="absolute top-4 text-[#a1a1aa] text-[10px] font-bold group-hover:text-white drop-shadow-md whitespace-nowrap bg-bg-base/80 px-1 rounded z-10">
                {station.code}
              </div>
              <div className="absolute top-8 text-[#d4d4d8] text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap bg-bg-elevated/95 px-2 py-1 rounded backdrop-blur-sm border border-border-primary pointer-events-none transition-opacity z-50 shadow-xl">
                <div className="font-bold">{station.name}</div>
                <div className="text-[10px] text-text-muted">Platforms: {station.platforms}</div>
              </div>
            </div>
          </Marker>
        ))}

        {/* Signals */}
        {signals.map((sig) => {
          const colors = {
            clear: "#22c55e",
            attention: "#eab308",
            caution: "#f97316",
            stop: "#ef4444",
          };
          const color = colors[sig.aspect as keyof typeof colors] || "#71717a";

          return (
            <Marker key={`signal-${sig.id}`} longitude={sig.lng} latitude={sig.lat} anchor="center">
              <div className="relative group cursor-pointer">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-md z-10 relative"
                  style={{ backgroundColor: color, border: "1px solid #18181b" }}
                />
                {sig.failure && (
                  <div className="absolute inset-0 border border-status-danger rounded-full animate-ping" />
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-bg-elevated border border-border-primary px-2 py-1 rounded shadow-lg z-50 text-[10px] whitespace-nowrap">
                  <div><span className="font-bold">{sig.name}</span></div>
                  <div>Aspect: <span style={{ color }}>{sig.aspect.toUpperCase()}</span></div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Trains */}
        {trains.filter((t) => t.status === "running" || t.status === "waiting" || t.status === "at_station").map((train) => {
          // Fallback if simulation engine hasn't populated coordinates yet
          if (train.lng === undefined || train.lat === undefined) return null;

          const bearing = train.bearing || 0;
          const isDelayed = train.delay_minutes > 5;
          const color = train.status === 'at_station' ? '#3b82f6' : (isDelayed ? '#f59e0b' : '#22c55e');

          return (
            <Marker
              key={`train-${train.id}`}
              longitude={train.lng}
              latitude={train.lat}
              anchor="center"
              style={{ zIndex: 30 }}
            >
              <div className="relative group cursor-pointer flex flex-col items-center">
                {/* Train Icon / Direction Indicator */}
                <div 
                  className="w-5 h-5 rounded border-2 shadow-lg relative z-30 flex items-center justify-center transition-colors"
                  style={{ 
                    backgroundColor: '#18181b', 
                    borderColor: color,
                    transform: `rotate(${bearing}deg)` 
                  }}
                >
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-white" style={{ backgroundColor: color }} />
                </div>
                
                {/* Label */}
                <div className="absolute top-6 bg-[#18181b]/90 text-white text-[9px] font-bold px-1 rounded shadow-sm whitespace-nowrap z-20 border border-border-primary">
                  {train.number}
                </div>
                
                {/* Expanded Tooltip on Hover */}
                <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  <div className="w-48 bg-bg-elevated/95 backdrop-blur-md border border-border-primary text-text-primary rounded-lg p-3 shadow-xl">
                    <div className="font-bold text-sm mb-1 truncate">{train.name}</div>
                    <div className="text-xs text-text-secondary space-y-1">
                      <div className="flex justify-between">
                        <span>Speed:</span>
                        <span className="font-bold text-white">{Math.round(train.current_speed_kmh || 0)} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-bold uppercase text-white">{train.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next:</span>
                        <span className="font-bold text-white">{train.next_station || 'N/A'}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border-primary">
                        {train.delay_minutes > 0 ? (
                          <div className="text-status-warning font-bold">Delayed +{train.delay_minutes}m</div>
                        ) : (
                          <div className="text-status-success font-bold">On Time</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
