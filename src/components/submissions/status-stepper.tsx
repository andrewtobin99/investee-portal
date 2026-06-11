import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getStatusConfig } from "@/components/shared/status-badge";
import type { WorkflowStatusSlug } from "@/types/database";

/** Visual stages of the submission lifecycle (decision is a terminal state). */
const STEPS: { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under review" },
  { key: "decision", label: "Decision" },
];

/**
 * Horizontal progress indicator. Maps the current status slug onto one of four
 * stages. "follow_up_requested" sits at the review stage; "rejected" lands on
 * the decision stage but is rendered in a muted/destructive tone.
 */
export function StatusStepper({ slug }: { slug: string | null | undefined }) {
  const config = getStatusConfig(slug);
  const current = config.step; // 0..3
  const isRejected = (slug as WorkflowStatusSlug) === "rejected";

  return (
    <ol className="flex w-full items-center" role="list" aria-label="Submission progress">
      {STEPS.map((step, i) => {
        const isComplete = i < current;
        const isCurrent = i === current;
        const terminalTone =
          isCurrent && i === 3 && isRejected ? "destructive" : "primary";

        return (
          <li
            key={step.key}
            className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    terminalTone === "primary" &&
                    "border-primary bg-primary/10 text-primary",
                  isCurrent &&
                    terminalTone === "destructive" &&
                    "border-destructive bg-destructive/10 text-destructive",
                  !isComplete && !isCurrent && "border-border bg-card text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-center text-xs",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  "mx-2 mb-5 h-0.5 flex-1 rounded",
                  i < current ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
