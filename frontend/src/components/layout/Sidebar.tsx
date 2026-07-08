import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { cn } from "../../lib/utils";
import { NAV_ITEMS } from "../../lib/constants";
import {
  LayoutDashboard,
  Map,
  Train,
  Building2,
  CircleDot,
  Route,
  Bell,
  Wrench,
  Brain,
  BarChart3,
  FileText,
  Users,
  Settings,
  HelpCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Map, Train, Building2, CircleDot, Route, Bell, Wrench,
  Brain, BarChart3, FileText, Users, Settings, HelpCircle, Activity,
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border-primary bg-bg-surface transition-all duration-300",
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]"
      )}
    >
      <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-border-primary px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
          RM
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-text-primary">RailMind AI</span>
            <span className="truncate text-[10px] text-text-muted">Railway Operations</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
              )}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border-primary p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
