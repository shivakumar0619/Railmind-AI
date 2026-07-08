import { HelpCircle, Book, MessageSquare, ExternalLink, Keyboard, ShieldAlert, FileText, ChevronRight } from "lucide-react";

export default function HelpPage() {
  const shortcuts = [
    { key: "Ctrl + K", action: "Global Search" },
    { key: "Alt + D", action: "Go to Dashboard" },
    { key: "Alt + M", action: "Go to Digital Twin" },
    { key: "Esc", action: "Close Active Modal" },
  ];

  const faqs = [
    { q: "How is signal health calculated?", a: "Signal health is an aggregate score based on physical telemetry, predictive maintenance models, and active alerts." },
    { q: "What does 'Simulation Mode' mean?", a: "The platform is currently operating on simulated AI telemetry data for demonstration and training purposes." },
    { q: "How do I acknowledge critical alerts?", a: "Navigate to the Alerts page and click 'Acknowledge' next to any active alert to silence the alarm." },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-primary pb-4">
        <div className="rounded-lg bg-accent/20 p-2 text-accent border border-accent/30">
          <HelpCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Help & Documentation</h1>
          <p className="mt-1 text-sm text-text-secondary">Get assistance, learn keyboard shortcuts, and find documentation.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Quick Links */}
        <div className="space-y-4 md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-interactive card cursor-pointer group flex flex-col justify-between">
              <div>
                <Book className="mb-4 h-8 w-8 text-text-muted group-hover:text-accent transition-colors" />
                <h3 className="text-lg font-medium text-text-primary mb-2">User Guide</h3>
                <p className="text-sm text-text-secondary mb-4">Comprehensive documentation on how to use the dashboard, monitor trains, and respond to alerts.</p>
              </div>
              <span className="text-sm font-medium text-accent inline-flex items-center gap-1 group-hover:underline">Read Docs <ExternalLink className="h-3 w-3" /></span>
            </div>
            
            <div className="card-interactive card cursor-pointer group flex flex-col justify-between">
              <div>
                <ShieldAlert className="mb-4 h-8 w-8 text-text-muted group-hover:text-status-danger transition-colors" />
                <h3 className="text-lg font-medium text-text-primary mb-2">Emergency Protocols</h3>
                <p className="text-sm text-text-secondary mb-4">Standard Operating Procedures (SOP) for critical alerts and network failures.</p>
              </div>
              <span className="text-sm font-medium text-status-danger inline-flex items-center gap-1 group-hover:underline">View SOP <ExternalLink className="h-3 w-3" /></span>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2 border-b border-border-primary pb-2">
              <FileText className="h-5 w-5 text-text-muted" /> Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="group cursor-pointer rounded-lg border border-border-primary bg-bg-surface-hover p-4 transition-colors hover:border-border-strong">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-text-primary text-sm">{faq.q}</h4>
                    <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-2 text-xs text-text-secondary leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Support & Shortcuts */}
        <div className="space-y-4">
          <div className="card space-y-4 border-t-4 border-t-accent">
            <h3 className="font-semibold text-text-primary flex items-center gap-2 border-b border-border-primary pb-2">
              <MessageSquare className="h-5 w-5 text-accent" /> Technical Support
            </h3>
            <p className="text-sm text-text-secondary">
              L1/L2 support is available 24/7 for command centre operators.
            </p>
            <div className="rounded-lg bg-bg-surface-hover p-3 border border-border-primary">
              <p className="text-xs uppercase text-text-muted font-bold tracking-wider mb-1">Direct Hotline</p>
              <p className="font-mono text-lg text-text-primary">+91 1800 111 2222</p>
            </div>
            <button className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
              Open Support Ticket
            </button>
          </div>

          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2 border-b border-border-primary pb-2">
              <Keyboard className="h-5 w-5 text-text-muted" /> Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              {shortcuts.map((sc, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{sc.action}</span>
                  <kbd className="rounded border border-border-strong bg-bg-surface px-2 py-1 font-mono text-[10px] text-text-primary shadow-sm">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
