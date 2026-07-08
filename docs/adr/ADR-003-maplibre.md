# ADR-003: MapLibre GL JS Over Leaflet

## Status
Accepted

## Date
2026-07-05

## Context

The Digital Twin feature requires an interactive railway corridor map with animated train markers, signal indicators, station markers, smooth zoom/pan, tooltips, and configurable tile providers. The map must support switching between OpenStreetMap, MapTiler, Mapbox, and self-hosted tile servers through configuration alone.

Options evaluated:
- **Leaflet**: Mature, lightweight, raster-tile based, CPU rendering, no rotation support, limited styling customization.
- **MapLibre GL JS**: GPU-accelerated WebGL rendering, vector tiles, smooth sub-pixel zoom, rotation/pitch support, style-specification driven, open-source fork of Mapbox GL JS.

## Decision

Use MapLibre GL JS (v5.24.0) with the react-map-gl (v8.1.1) React wrapper. Import from `react-map-gl/maplibre` entry point.

Map tile providers are configurable via environment variables — switching providers requires no code changes.

## Consequences

### Positive
- GPU-accelerated WebGL rendering for smooth 60fps map interactions
- Vector tiles are smaller and faster than raster tiles
- Smooth zoom/rotation/pitch for immersive Digital Twin experience
- Style specification allows deep customization of map appearance
- Configurable tile providers (OSM, MapTiler, Mapbox, self-hosted) via style URLs
- Open-source with no vendor lock-in

### Negative
- Higher GPU requirements than Leaflet's CPU-based rendering
- WebGL not available on some older devices/browsers
- react-map-gl v8.1.1 has minor edge-case bugs with React 19 (Marker during rapid nav)

### Risks
- WebGL compatibility on older hardware — mitigated by graceful fallback detection and minimum browser requirements
