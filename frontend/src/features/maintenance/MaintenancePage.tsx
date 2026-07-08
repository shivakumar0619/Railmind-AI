import { Wrench, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default function MaintenancePage() {
  const tasks = [
    { id: 1, type: "Signal Calibration", location: "Bhongir (BG)", status: "In Progress", urgency: "Medium", due: "Today" },
    { id: 2, type: "Track Inspection", location: "Secunderabad (SC)", status: "Scheduled", urgency: "High", due: "Tomorrow" },
    { id: 3, type: "Point Machine Repair", location: "Kazipet (KZJ)", status: "Pending Parts", urgency: "Critical", due: "Overdue" },
    { id: 4, type: "Overhead Equipment Check", location: "Warangal (WL)", status: "Completed", urgency: "Low", due: "Yesterday" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Maintenance</h1>
        <p className="mt-1 text-sm text-text-secondary">Track and signal maintenance schedules</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tasks.map((task) => (
          <div key={task.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-text-primary">{task.type}</h3>
              <Wrench className="h-4 w-4 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary mb-4">{task.location}</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className="font-medium text-text-primary">{task.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Urgency</span>
                <span className={`font-medium ${task.urgency === 'Critical' ? 'text-status-danger' : task.urgency === 'High' ? 'text-status-warning' : 'text-text-primary'}`}>{task.urgency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Due</span>
                <span className="font-medium text-text-primary">{task.due}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
