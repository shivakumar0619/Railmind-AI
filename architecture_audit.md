# RailMind AI - Architectural Audit

## Current Architecture Overview
RailMind AI is built as a decoupled modern web application mimicking a Railway Operations Control Centre (OCC).
- **Backend:** FastAPI (Python 3.12) with a synchronous SQLAlchemy setup. Contains a background `simulation_engine` that runs continuously to update railway states (trains, signals, alerts) and broadcasts them via REST APIs.
- **Frontend:** React 19 + Vite + TypeScript, using MapLibre GL for the Digital Twin, TailwindCSS for styling, and Recharts for analytics. 
- **Deployment:** Docker Compose setup with isolated frontend, backend, and PostgreSQL containers.

## Strengths
- **Clean Separation of Concerns:** The backend is the single source of truth; the frontend only consumes REST APIs, adhering to OCC architectural patterns.
- **Modern Tech Stack:** React 19, MapLibre GL, and FastAPI provide a performant foundation.
- **Background Simulation Loop:** The `SimulationEngine` runs asynchronously from the API handlers, preventing request blocking.

## Weaknesses & Critical Bugs

### 1. Dashboard Blanking (Issue 1)
- **Root Cause:** The `DashboardPage.tsx` uses standard React `useEffect` with `setInterval` for polling, combined with brittle state handling. If any backend API throws a 500 or is temporarily unreachable, `Promise.all` fails, the state isn't updated, or worse, an unhandled runtime error crashes the React tree resulting in a blank screen.
- **Fix:** Migrate all data fetching to `@tanstack/react-query`. Implement Error Boundaries. Provide stale data fallbacks and skeleton loaders.

### 2. Digital Twin Blanking & Track Geometry (Issues 2, 7, 9, 10, 15)
- **Root Cause:** `TrackMap.tsx` currently relies on point-to-point (straight line) GeoJSON interpolation if `polyline` data is missing. The train physics engine computes movement linearly. When trains hit terminal states or missing routes, they disappear, crashing the map render cycle. The visual quality does not match an OCC (no curves, missing layers).
- **Fix:** 
  1. Generate accurate, curved GeoJSON polylines for all routes based on the South Central Railway (SCR) map.
  2. Upgrade `TrackMap.tsx` with professional MapLibre layers (weather, maintenance, occupancy).
  3. Update `simulation.py` to interpolate train coordinates accurately along the curved GeoJSON geometry.

### 3. Simulation & Train Lifecycle (Issues 3, 4, 6)
- **Root Cause:** The `SimulationEngine` in `simulation.py` handles terminal arrivals poorly. Earlier versions stopped trains forever, while the recent version causes an immediate pendulum reversal. 
- **Fix:** Implement the strict lifecycle: `Origin -> Depart -> Travel -> Intermediate Stations -> Destination -> Platform Arrival -> 5 min Dwell -> Crew Change -> Reverse -> Return`. Ensure trains never vanish and the total count remains stable forever.

### 4. Signal System (Issue 5, 10)
- **Root Cause:** Signal logic lacks real Absolute Block System (ABS) strictness and approach locking. It merely flips based on immediate occupancy.
- **Fix:** Implement robust 4-aspect Indian Railways signalling (Green, Double Yellow, Yellow, Red) using look-ahead block occupancy, probabilistic failures, and maintenance speed restrictions.

### 5. Routing Engine (Issues 8, 14)
- **Root Cause:** `routing_service.py` uses a basic Dijkstra implementation with minimal metrics.
- **Fix:** Upgrade Dijkstra to support `via`, `avoid`, shortest vs fastest, and factor in dynamic congestion and speed restrictions.

### 6. Mock Data Quality (Issues 11, 13, 16)
- **Root Cause:** Only 29 trains and 17 stations exist. Tracks are sparse.
- **Fix:** Expand `stations.json`, `routes.json`, and `trains.json` using the provided SCR map. Increase fleet to 60-100 realistic trains (Rajdhani, Vande Bharat, Freight, etc.).

## Improvement Plan & Execution Order

1. **Phase 1: Backend Data & Topography Overhaul (Foundation)**
   - Expand `stations.json` with all major SCR junctions (Secunderabad, Kazipet, Vijayawada, Guntur, Renigunta, etc.).
   - Expand `routes.json` with highly realistic curved `polyline` arrays representing actual SCR geometry.
   - Expand `trains.json` to 70+ trains covering diverse types.

2. **Phase 2: Simulation Physics & Signalling (Core Logic)**
   - Rewrite `SimulationEngine` physics to move strictly along GeoJSON splines.
   - Enforce the 5-minute dwell + crew change lifecycle at destinations.
   - Upgrade the Signal state machine to strict 4-aspect ABS.
   - Refactor `routing_service.py`.

3. **Phase 3: Frontend Defensive Rendering & Architecture (Stability)**
   - Introduce `@tanstack/react-query` configuration in `App.tsx` / `main.tsx`.
   - Wrap application in standard Error Boundaries.
   - Refactor `DashboardPage.tsx` and `SystemStatusPage.tsx` to use robust polling and fallbacks.

4. **Phase 4: Digital Twin & UI Polish (Presentation)**
   - Rebuild `TrackMap.tsx` to render the new curved tracks, accurate train rotation, and MapLibre controls (layers, legend).
   - Upgrade `StationsPage.tsx`, `SignalsPage.tsx`, `RoutesPage.tsx`, and `RoutePlannerPage.tsx` to professional OCC-grade data tables and interfaces.

## Estimated Complexity
**High.** This requires synchronised changes across database seeding (JSON), backend physics and routing math, and frontend WebGL/React architecture. I will execute these phases autonomously and iteratively, verifying builds at each step.
