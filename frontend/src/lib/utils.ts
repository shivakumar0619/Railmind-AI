import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Format a date to relative time (e.g., "5 minutes ago").
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

/**
 * Format a number with commas (Indian numbering system).
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-IN");
}

/**
 * Format speed in km/h with unit.
 */
export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

/**
 * Format distance in km with unit.
 */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

/**
 * Format delay in minutes with sign.
 */
export function formatDelay(minutes: number): string {
  if (minutes === 0) return "On time";
  if (minutes > 0) return `+${minutes} min late`;
  return `${minutes} min early`;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

/**
 * Generate a random ID for client-side use.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Mandatory disclaimer text */
export const DISCLAIMER_TEXT =
  "This platform is an independent educational and operational simulation and is not affiliated with, endorsed by, or a replacement for Indian Railways Kavach or any certified railway safety system.";

/** Application name constant */
export const APP_NAME = "RailMind AI";

/** Application tagline */
export const APP_TAGLINE = "AI-Assisted Railway Operations Intelligence Platform";
