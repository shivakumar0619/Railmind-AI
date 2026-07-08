import { Settings, Save, Bell, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Configure platform preferences</p>
      </div>

      <div className="space-y-4">
        <div className="card space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-medium text-text-primary border-b border-border-primary pb-2">
            <Bell className="h-5 w-5" /> Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Critical Alerts</p>
              <p className="text-xs text-text-secondary">Receive SMS and email for critical incidents</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-accent relative cursor-pointer">
              <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Daily Summary</p>
              <p className="text-xs text-text-secondary">Receive a daily email digest</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-bg-surface-hover relative cursor-pointer border border-border-strong">
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-text-muted"></div>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-medium text-text-primary border-b border-border-primary pb-2">
            <Database className="h-5 w-5" /> Simulation
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Data Source</p>
              <p className="text-xs text-text-secondary">Toggle between live (if available) and simulation data</p>
            </div>
            <select className="rounded border border-border-primary bg-bg-primary px-3 py-1.5 text-sm text-text-primary">
              <option>Simulation</option>
              <option disabled>Live Feed (Unavailable)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </div>
  );
}
