import { cn } from "@/lib/utils/cn";
import type { WorkflowStatusSlug } from "@/types/database";

/**
 * Single source of truth for status presentation. Ordered list also drives the
 * StatusStepper. Colours use a neutral base with semantic accents.
 */
export const STATUS_CONFIG: Record<
  WorkflowStatusSlug,
  { label: string; dot: string; badge: string; step: number }
> = {
  draft: {
    label: "Draft",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    step: 0,
  },
  submitted: {
    label: "Submitted",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    step: 1,
  },
  under_review: {
    label: "Under review",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    step: 2,
  },
  follow_up_requested: {
    label: "Follow-up requested",
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 ring-orange-200",
    step: 2,
  },
  approved: {
    label: "Approved",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    step: 3,
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-red-200",
    step: 3,
  },
};

/** Falls back gracefully if the backend introduces an unknown slug. */
export function getStatusConfig(slug: string | undefined | null) {
  return (
    STATUS_CONFIG[slug as WorkflowStatusSlug] ?? {
      label: slug ?? "Unknown",
      dot: "bg-slate-400",
      badge: "bg-slate-100 text-slate-700 ring-slate-200",
      step: 0,
    }
  );
}

export function StatusBadge({
  slug,
  label,
  className,
}: {
  slug: string | null | undefined;
  /** Optional override (e.g. the human label from workflow_statuses). */
  label?: string | null;
  className?: string;
}) {
  const config = getStatusConfig(slug);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        config.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden />
      {label ?? config.label}
    </span>
  );
}
