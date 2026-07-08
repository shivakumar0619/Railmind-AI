import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { AppShell } from "./components/layout/AppShell";

const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const TrainsPage = lazy(() => import("./features/trains/TrainsPage"));
const StationsPage = lazy(() => import("./features/stations/StationsPage"));
const SignalsPage = lazy(() => import("./features/signals/SignalsPage"));
const AlertsPage = lazy(() => import("./features/alerts/AlertsPage"));
const RoutesPage = lazy(() => import("./features/routes/RoutesPage"));
const RoutePlannerPage = lazy(() => import("./features/route-planner/RoutePlannerPage"));
const DigitalTwinPage = lazy(() => import("./features/digital-twin/DigitalTwinPage"));
const MaintenancePage = lazy(() => import("./features/maintenance/MaintenancePage"));
const AiInsightsPage = lazy(() => import("./features/ai-insights/AiInsightsPage"));
const AnalyticsPage = lazy(() => import("./features/analytics/AnalyticsPage"));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const UsersPage = lazy(() => import("./features/users/UsersPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const HelpPage = lazy(() => import("./features/help/HelpPage"));
const SystemStatusPage = lazy(() => import("./features/system-status/SystemStatusPage"));
const NotFoundPage = lazy(() => import("./features/not-found/NotFoundPage"));

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="digital-twin" element={<DigitalTwinPage />} />
          <Route path="route-planner" element={<RoutePlannerPage />} />
          <Route path="trains" element={<TrainsPage />} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="signals" element={<SignalsPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="ai-insights" element={<AiInsightsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="system-status" element={<SystemStatusPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-sm text-text-secondary">Loading...</span>
      </div>
    </div>
  );
}
