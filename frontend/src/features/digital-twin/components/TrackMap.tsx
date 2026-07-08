import { useState, useRef, useMemo } from "react";
import { Train as TrainIcon, MapPin, AlertCircle } from "lucide-react";

interface TrackMapProps {
  stations: any[];
  routes: any[];
  signals: any[];
  trains: any[];
}

export default function TrackMap({ stations, routes, signals, trains }: TrackMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // ViewBox state for pan/zoom
  const [viewBox, setViewBox] = useState({ x: -200, y: -200, w: 2400, h: 1900 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Coordinate projection
  const bounds = useMemo(() => {
    if (!stations.length) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    return {
      minLat: Math.min(...stations.map(s => s.lat)),
      maxLat: Math.max(...stations.map(s => s.lat)),
      minLng: Math.min(...stations.map(s => s.lng)),
      maxLng: Math.max(...stations.map(s => s.lng)),
    };
  }, [stations]);

  const SVG_WIDTH = 2000;
  const SVG_HEIGHT = 1500;

  const project = (lat: number, lng: number) => {
    const wSpan = bounds.maxLng - bounds.minLng || 1;
    const hSpan = bounds.maxLat - bounds.minLat || 1;
    const x = ((lng - bounds.minLng) / wSpan) * SVG_WIDTH;
    const y = ((bounds.maxLat - lat) / hSpan) * SVG_HEIGHT;
    return { x, y };
  };

  const getStationByCode = (code: string) => stations.find(s => s.code === code);

  // Pan and Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const mx = e.nativeEvent.offsetX;
    const my = e.nativeEvent.offsetY;
    
    // Zoom around center for simplicity in this prototype
    const newW = viewBox.w * zoomFactor;
    const newH = viewBox.h * zoomFactor;
    const dw = viewBox.w - newW;
    const dh = viewBox.h - newH;
    
    setViewBox({
      x: viewBox.x + dw / 2,
      y: viewBox.y + dh / 2,
      w: newW,
      h: newH
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Convert screen pixels to SVG units (approximate)
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;

    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx * scaleX,
      y: prev.y - dy * scaleY
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderRoutes = () => {
    return routes.map(route => {
      const src = getStationByCode(route.source_code);
      const tgt = getStationByCode(route.target_code);
      if (!src || !tgt) return null;
      const p1 = project(src.lat, src.lng);
      const p2 = project(tgt.lat, tgt.lng);

      return (
        <line
          key={route.id}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke="#3f3f46"
          strokeWidth="6"
          strokeLinecap="round"
        />
      );
    });
  };

  const renderStations = () => {
    return stations.map(st => {
      const p = project(st.lat, st.lng);
      return (
        <g key={st.id} transform={`translate(${p.x}, ${p.y})`} className="cursor-pointer group">
          <circle r="12" fill="#18181b" stroke="#71717a" strokeWidth="4" className="transition-colors group-hover:stroke-accent" />
          <text y="30" textAnchor="middle" fill="#a1a1aa" fontSize="16" fontWeight="bold" className="group-hover:fill-accent">
            {st.code}
          </text>
          <text y="-20" textAnchor="middle" fill="#d4d4d8" fontSize="14" className="opacity-0 transition-opacity group-hover:opacity-100">
            {st.name}
          </text>
        </g>
      );
    });
  };

  const renderSignals = () => {
    return signals.map(sig => {
      const route = routes.find(r => r.id === sig.route_id);
      if (!route) return null;
      const src = getStationByCode(route.source_code);
      const tgt = getStationByCode(route.target_code);
      if (!src || !tgt) return null;

      const p1 = project(src.lat, src.lng);
      const p2 = project(tgt.lat, tgt.lng);
      
      const pct = (sig.block_index / sig.total_blocks);
      const x = p1.x + (p2.x - p1.x) * pct;
      const y = p1.y + (p2.y - p1.y) * pct;

      const colors = {
        clear: "#22c55e",
        attention: "#eab308",
        caution: "#f97316",
        stop: "#ef4444"
      };
      
      const color = colors[sig.aspect as keyof typeof colors] || "#71717a";

      return (
        <g key={sig.id} transform={`translate(${x}, ${y})`}>
          <rect x="-6" y="-6" width="12" height="12" rx="3" fill={color} stroke="#18181b" strokeWidth="2" />
        </g>
      );
    });
  };

  const renderTrains = () => {
    return trains.filter(t => t.status === "running").map(train => {
      const route = routes.find(r => r.id === train.current_route_id);
      if (!route) return null;
      const src = getStationByCode(route.source_code);
      const tgt = getStationByCode(route.target_code);
      if (!src || !tgt) return null;

      const p1 = project(src.lat, src.lng);
      const p2 = project(tgt.lat, tgt.lng);
      
      const pct = (train.progress_pct / 100);
      const x = p1.x + (p2.x - p1.x) * pct;
      const y = p1.y + (p2.y - p1.y) * pct;

      // Tooltip placement logic
      return (
        <g key={train.id} transform={`translate(${x}, ${y})`} className="cursor-pointer group">
          <circle r="16" fill="#3b82f6" className="animate-pulse" opacity="0.3" />
          <circle r="8" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
          
          {/* Label */}
          <rect x="-24" y="-36" width="48" height="20" rx="4" fill="#27272a" opacity="0.9" />
          <text y="-22" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
            {train.number}
          </text>
          
          {/* Expanded Tooltip on Hover */}
          <g className="opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" transform="translate(20, -60)">
            <rect width="160" height="90" rx="6" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
            <text x="10" y="20" fill="#fafafa" fontSize="14" fontWeight="bold">{train.name}</text>
            <text x="10" y="40" fill="#a1a1aa" fontSize="12">Speed: {Math.round(train.current_speed_kmh)} km/h</text>
            <text x="10" y="58" fill="#a1a1aa" fontSize="12">Section: {route.source_code}-{route.target_code}</text>
            {train.delay_minutes > 0 ? (
              <text x="10" y="76" fill="#ef4444" fontSize="12" fontWeight="bold">Delayed +{train.delay_minutes}m</text>
            ) : (
              <text x="10" y="76" fill="#22c55e" fontSize="12" fontWeight="bold">On Time</text>
            )}
          </g>
        </g>
      );
    });
  };

  return (
    <div className="relative h-full w-full bg-[#09090b] overflow-hidden rounded-xl border border-border-primary"
         onWheel={handleWheel}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        className={`w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#27272a" strokeWidth="1" opacity="0.3" />
          </pattern>
        </defs>
        
        {/* Infinite-like Grid Background */}
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />
        
        {/* Layers */}
        <g id="layer-routes">{renderRoutes()}</g>
        <g id="layer-signals">{renderSignals()}</g>
        <g id="layer-stations">{renderStations()}</g>
        <g id="layer-trains">{renderTrains()}</g>
      </svg>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="rounded-lg bg-bg-surface-hover/80 backdrop-blur px-3 py-1.5 border border-border-primary text-xs text-text-secondary shadow-sm">
          Use mouse wheel to zoom, drag to pan
        </div>
      </div>
    </div>
  );
}
