import { cn } from "@/lib/utils/cn";
import type { WorkflowStatusSlug } from "@/types/database";

/**
 * Single source of truth for status presentation. Ordered list also drives the
 * StatusStepper. Colours use the Camco accent palette (warm/cool branded tints
 * on a white base) rather than generic Tailwind hues.
 */
export const STATUS_CONFIG: Record<
  WorkflowStatusSlug,
  { label: string; dot: string; badge: string; step: number }
> = {
  draft: {
    label: "Draft",
    dot: "bg-[#9A9CB0]",
    badge: "bg-[#F0F0F3] text-[#4A4C63] ring-[#E0E1E9]",
    step: 0,
  },
  submitted: {
    label: "Submitted",
    dot: "bg-[#008FC3]",
    badge: "bg-[#E3F4FB] text-[#036A93] ring-[#BFE6F4]",
    step: 1,
  },
  under_review: {
    label: "Under review",
    dot: "bg-[#FF6432]",
    badge: "bg-[#FFF0E8] text-[#C2521A] ring-[#FBD9C7]",
    step: 2,
  },
  follow_up_requested: {
    label: "Follow-up requested",
    dot: "bg-[#EB8705]",
    badge: "bg-[#FFF3E0] text-[#A35E00] ring-[#F6DFB0]",
    step: 2,
  },
  approved: {
    label: "Approved",
    dot: "bg-[#35C3CF]",
    badge: "bg-[#E2F7F7] text-[#15808A] ring-[#BDEAEA]",
    step: 3,
  },
  rejected: {
    label: "Rejected",
    dot: "bg-[#C0334E]",
    badge: "bg-[#FCEAED] text-[#B02E48] ring-[#F4D2D9]",
    step: 3,
  },
};

/** Falls back gracefully if the backend introduces an unknown slug. */
export function getStatusConfig(slug: string | undefined | null) {
  return (
    STATUS_CONFIG[slug as WorkflowStatusSlug] ?? {
      label: slug ?? "Unknown",
      dot: "bg-[#9A9CB0]",
      badge: "bg-[#F0F0F3] text-[#4A4C63] ring-[#E0E1E9]",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        config.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden />
      {label ?? config.label}
    </span>
  );
}
