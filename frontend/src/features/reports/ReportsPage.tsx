import { useState } from "react";
import { FileText, Download, Filter, Plus, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState([
    { id: 1, title: "Daily Operations Summary", date: "Jul 06, 2026", type: "PDF", size: "2.4 MB" },
    { id: 2, title: "Weekly Incident Log", date: "Jul 05, 2026", type: "CSV", size: "1.1 MB" },
    { id: 3, title: "Monthly Performance Review", date: "Jul 01, 2026", type: "PDF", size: "5.7 MB" },
    { id: 4, title: "Maintenance Audit", date: "Jun 28, 2026", type: "PDF", size: "3.2 MB" },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      setReports(prev => [{
        id: Date.now(),
        title: "Ad-hoc Telemetry Report",
        date: date,
        type: "PDF",
        size: "0.8 MB"
      }, ...prev]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Reports & Exports</h1>
          <p className="mt-1 text-sm text-text-secondary">Generate and download operational reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-surface-hover transition-colors">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button 
            onClick={generateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Generate New
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden flex-1 border border-border-primary shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-surface border-b border-border-primary text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
              <th className="px-6 py-4">Report Name</th>
              <th className="px-6 py-4">Date Generated</th>
              <th className="px-6 py-4">Format</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-bg-surface-hover/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-bg-base p-2 border border-border-primary group-hover:border-accent/50 transition-colors">
                      <FileText className="h-4 w-4 text-accent" />
                    </div>
                    <span className="font-medium text-text-primary">{r.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-secondary">{r.date}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full border border-border-strong bg-bg-base px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    {r.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-text-secondary font-mono">{r.size}</td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-1.5 rounded bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent/20">
                    <Download className="h-3 w-3" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
