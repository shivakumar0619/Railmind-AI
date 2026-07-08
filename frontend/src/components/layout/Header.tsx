import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";

/**
 * Application header bar.
 * Shows search, IST clock, notifications, and user menu.
 */
export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });

  const dateStr = currentTime.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border-primary bg-bg-surface px-6">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-primary px-3 py-1.5">
        <Search className="h-4 w-4 text-text-muted" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search trains, stations, signals..."
          className="w-64 border-none bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        <kbd className="hidden rounded border border-border-primary px-1.5 py-0.5 text-[10px] text-text-muted sm:inline">
          ⌘K
        </kbd>
      </div>

      {/* Right side: Clock + Notifications + User */}
      <div className="flex items-center gap-4">
        {/* IST Clock */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="text-right">
            <p className="text-xs font-medium text-text-primary font-mono tabular-nums">
              {timeStr} IST
            </p>
            <p className="text-[10px] text-text-muted">{dateStr}</p>
          </div>
          <div className="h-8 w-px bg-border-primary" />
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-status-danger" />
        </button>

        {/* User Avatar */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
          aria-label="User menu"
        >
          AD
        </button>
      </div>
    </header>
  );
}
