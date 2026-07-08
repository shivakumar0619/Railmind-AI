/** Application-wide constants */

/** Navigation items for the sidebar */
export const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { label: "Digital Twin", path: "/digital-twin", icon: "Map" },
  { label: "Route Planner", path: "/route-planner", icon: "MapPin" },
  { label: "Trains", path: "/trains", icon: "Train" },
  { label: "Stations", path: "/stations", icon: "Building2" },
  { label: "Signals", path: "/signals", icon: "CircleDot" },
  { label: "Routes", path: "/routes", icon: "Route" },
  { label: "Alerts", path: "/alerts", icon: "Bell" },
  { label: "Maintenance", path: "/maintenance", icon: "Wrench" },
  { label: "AI Insights", path: "/ai-insights", icon: "Brain" },
  { label: "Analytics", path: "/analytics", icon: "BarChart3" },
  { label: "Reports", path: "/reports", icon: "FileText" },
  { label: "Users", path: "/users", icon: "Users" },
  { label: "Settings", path: "/settings", icon: "Settings" },
  { label: "Help", path: "/help", icon: "HelpCircle" },
  { label: "System Status", path: "/system-status", icon: "Activity" },
] as const;

/** User roles */
export const ROLES = {
  ADMINISTRATOR: "administrator",
  DISPATCHER: "dispatcher",
  OPERATOR: "operator",
  MAINTENANCE_ENGINEER: "maintenance_engineer",
  VIEWER: "viewer",
} as const;

/** Signal aspects */
export const SIGNAL_ASPECTS = {
  STOP: "stop",
  CAUTION: "caution",
  ATTENTION: "attention",
  CLEAR: "clear",
} as const;

/** Signal aspect display colors */
export const SIGNAL_COLORS: Record<string, string> = {
  stop: "#dc2626",
  caution: "#eab308",
  attention: "#ca8a04",
  clear: "#16a34a",
};

/** Train status values */
export const TRAIN_STATUS = {
  RUNNING: "running",
  STOPPED: "stopped",
  DELAYED: "delayed",
  AT_STATION: "at_station",
  MAINTENANCE: "maintenance",
  OUT_OF_SERVICE: "out_of_service",
} as const;

/** Alert severity levels */
export const ALERT_SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
} as const;

/** Polling intervals in milliseconds */
export const POLLING_INTERVALS = {
  FAST: 15_000,
  NORMAL: 30_000,
  SLOW: 60_000,
  VERY_SLOW: 300_000,
} as const;

/** Map tile provider configurations */
export const MAP_PROVIDERS: Record<string, { style: string; attribution: string }> = {
  openstreetmap: {
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    attribution: "© OpenStreetMap contributors, © CARTO",
  },
  maptiler: {
    style: "https://api.maptiler.com/maps/dataviz-dark/style.json",
    attribution: "© MapTiler, © OpenStreetMap contributors",
  },
};

/** Data source labels */
export const DATA_SOURCE_LABELS: Record<string, string> = {
  verified_railway_data: "Verified Railway Data",
  simulation: "Simulation Data",
  external_api: "External API",
};
