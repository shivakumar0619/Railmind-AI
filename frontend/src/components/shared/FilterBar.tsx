import { useState, useEffect } from "react";
import { Search, Filter as FilterIcon, X } from "lucide-react";

export type FilterType = "search" | "select" | "boolean";

export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  options?: { label: string; value: string | boolean }[]; // For select type
  placeholder?: string; // For search type
}

interface FilterBarProps {
  configs: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  className?: string;
}

export default function FilterBar({ configs, onFilterChange, className = "" }: FilterBarProps) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleChange = (id: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [id]: value };
      if (value === "" || value === "all" || value === false) delete newFilters[id];
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className={`flex flex-wrap items-center gap-3 p-3 bg-bg-elevated/50 border border-border-primary rounded-lg backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-2 text-text-muted mr-2 shrink-0">
        <FilterIcon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
      </div>
      
      {configs.map((config) => {
        if (config.type === "search") {
          return (
            <div key={config.id} className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder={config.placeholder || `Search ${config.label}...`}
                value={filters[config.id] || ""}
                onChange={(e) => handleChange(config.id, e.target.value)}
                className="w-full rounded-md border border-border-primary bg-bg-base py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          );
        }

        if (config.type === "select") {
          return (
            <select
              key={config.id}
              value={filters[config.id] || "all"}
              onChange={(e) => handleChange(config.id, e.target.value)}
              className="rounded-md border border-border-primary bg-bg-base py-1.5 pl-3 pr-8 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all shrink-0"
            >
              <option value="all">All {config.label}s</option>
              {config.options?.map((opt, i) => (
                <option key={i} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }

        if (config.type === "boolean") {
          return (
            <label key={config.id} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer shrink-0 border border-border-primary px-3 py-1.5 rounded-md bg-bg-base hover:bg-bg-surface transition-colors">
              <input
                type="checkbox"
                checked={!!filters[config.id]}
                onChange={(e) => handleChange(config.id, e.target.checked)}
                className="rounded border-border-primary bg-bg-base text-accent focus:ring-accent"
              />
              {config.label}
            </label>
          );
        }

        return null;
      })}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="ml-auto flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1.5 rounded-md hover:bg-bg-surface shrink-0"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
