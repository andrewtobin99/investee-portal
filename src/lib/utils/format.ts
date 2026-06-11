/** Formatting helpers shared across the portal. */

/** Format an ISO date as e.g. "12 Jun 2026". Returns "—" for empty input. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Format an ISO timestamp as e.g. "12 Jun 2026, 14:30". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Relative-from-now label, e.g. "in 3 days", "2 days ago". */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, "day");
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, "hour");
  const diffMin = Math.round(diffMs / (1000 * 60));
  return rtf.format(diffMin, "minute");
}

/** True when an ISO due date is in the past (relative to "now"). */
export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

/** Human-readable file size, e.g. "1.4 MB". */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
