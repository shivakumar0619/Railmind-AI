import { useMemo } from "react";
import Map, { NavigationControl, FullscreenControl, Marker, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Train as TrainIcon, MapPin, AlertCircle } from "lucide-react";

interface TrackMapProps {
  stations: any[];
  routes: any[];
  signals: any[];
  trains: any[];
}

export default function TrackMap({ stations, routes, signals, trains }: TrackMapProps) {
  // Compute GeoJSON for routes
  const routesGeoJSON = useMemo(() => {
    const features = routes.map((route) => {
      let coords = route.polyline;
      if (!coords) {
        const src = stations.find((s) => s.code === route.source_code);
        const tgt = stations.find((s) => s.code === route.target_code);
        if (src && tgt) {
          coords = [
            [src.lng, src.lat],
            [tgt.lng, tgt.lat],
          ];
        } else {
          coords = [];
        }
      }

      return {
        type: "Feature",
        properties: {
          id: route.id,
          source_code: route.source_code,
          target_code: route.target_code,
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
  }, [routes, stations]);

  const initialViewState = useMemo(() => {
    if (!stations.length) return { longitude: 77.2, latitude: 28.6, zoom: 4 };
    const minLng = Math.min(...stations.map((s) => s.lng));
    const maxLng = Math.max(...stations.map((s) => s.lng));
    const minLat = Math.min(...stations.map((s) => s.lat));
    const maxLat = Math.max(...stations.map((s) => s.lat));
    
    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: 5,
    };
  }, [stations]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#09090b]">
      <Map
        initialViewState={initialViewState}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
      >
        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" showCompass={false} />

        <Source id="routes" type="geojson" data={routesGeoJSON as any}>
          <Layer
            id="routes-line"
            type="line"
            paint={{
              "line-color": "#3f3f46",
              "line-width": 4,
            }}
          />
        </Source>

        {stations.map((station) => (
          <Marker
            key={`station-${station.id}`}
            longitude={station.lng}
            latitude={station.lat}
            anchor="center"
          >
            <div className="relative group cursor-pointer flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-[#18181b] border-2 border-[#71717a] group-hover:border-accent transition-colors shadow-lg" />
              <div className="absolute top-5 text-[#a1a1aa] text-sm font-bold group-hover:text-accent drop-shadow-md">
                {station.code}
              </div>
              <div className="absolute top-9 text-[#d4d4d8] text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap bg-bg-elevated/80 px-2 py-1 rounded backdrop-blur-sm border border-border-primary pointer-events-none transition-opacity z-50">
                {station.name}
              </div>
            </div>
          </Marker>
        ))}

        {signals.map((sig) => {
          const route = routes.find((r) => r.id === sig.route_id);
          if (!route) return null;
          const src = stations.find((s) => s.code === route.source_code);
          const tgt = stations.find((s) => s.code === route.target_code);
          if (!src || !tgt) return null;

          const pct = sig.block_index / sig.total_blocks;
          const lng = sig.lng ?? (src.lng + (tgt.lng - src.lng) * pct);
          const lat = sig.lat ?? (src.lat + (tgt.lat - src.lat) * pct);

          const colors = {
            clear: "#22c55e",
            attention: "#eab308",
            caution: "#f97316",
            stop: "#ef4444",
          };
          const color = colors[sig.aspect as keyof typeof colors] || "#71717a";

          return (
            <Marker key={`signal-${sig.id}`} longitude={lng} latitude={lat} anchor="center">
              <div
                className="w-3 h-3 rounded-sm shadow-md"
                style={{ backgroundColor: color, border: "2px solid #18181b" }}
              />
            </Marker>
          );
        })}

        {trains.filter((t) => t.status === "running").map((train) => {
          let lng = train.lng;
          let lat = train.lat;

          if (lng === undefined || lat === undefined) {
            const route = routes.find((r) => r.id === train.current_route_id);
            if (route) {
              const src = stations.find((s) => s.code === route.source_code);
              const tgt = stations.find((s) => s.code === route.target_code);
              if (src && tgt) {
                const pct = train.progress_pct / 100;
                lng = src.lng + (tgt.lng - src.lng) * pct;
                lat = src.lat + (tgt.lat - src.lat) * pct;
              }
            }
          }

          if (lng === undefined || lat === undefined) return null;

          const bearing = train.bearing || 0;

          return (
            <Marker
              key={`train-${train.id}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
              style={{ zIndex: 10 }}
            >
              <div className="relative group cursor-pointer flex flex-col items-center">
                {/* Pulsating ring */}
                <div className="absolute inset-0 bg-accent rounded-full opacity-30 animate-ping" />
                {/* Train Icon / Direction Indicator */}
                <div 
                  className="w-6 h-6 bg-accent rounded-full border-2 border-white flex items-center justify-center shadow-lg relative z-10"
                  style={{ transform: `rotate(${bearing}deg)` }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-white" />
                </div>
                {/* Label */}
                <div className="absolute top-8 bg-[#27272a]/90 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10 border border-[#3f3f46]">
                  {train.number}
                </div>
                
                {/* Expanded Tooltip on Hover */}
                <div className="absolute bottom-12 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  <div className="w-48 bg-bg-elevated/95 backdrop-blur-md border border-border-primary text-text-primary rounded-lg p-3 shadow-xl">
                    <div className="font-bold text-sm mb-1">{train.name}</div>
                    <div className="text-xs text-text-secondary space-y-1">
                      <div>Speed: {Math.round(train.current_speed_kmh)} km/h</div>
                      {(() => {
                        const r = routes.find(route => route.id === train.current_route_id);
                        if (!r) return null;
                        return <div>Section: {r.source_code}-{r.target_code}</div>;
                      })()}
                      {train.delay_minutes > 0 ? (
                        <div className="text-status-error font-bold mt-1">Delayed +{train.delay_minutes}m</div>
                      ) : (
                        <div className="text-status-success font-bold mt-1">On Time</div>
                      )}
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
