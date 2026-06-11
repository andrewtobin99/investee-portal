import { CalendarClock } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusStepper } from "@/components/submissions/status-stepper";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelative, isOverdue } from "@/lib/utils/format";
import type { SubmissionRequest } from "@/types/database";

export function SubmissionHeader({ submission }: { submission: SubmissionRequest }) {
  const status = submission.workflow_statuses;
  const open = status?.slug !== "approved" && status?.slug !== "rejected";
  const overdue = open && isOverdue(submission.due_date);

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge slug={status?.slug} label={status?.label} />
              {overdue ? (
                <span className="text-xs font-medium text-red-600">Overdue</span>
              ) : null}
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              {submission.title}
            </h1>
            {submission.description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {submission.description}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
              overdue ? "border-red-200 text-red-600" : "text-muted-foreground",
            )}
          >
            <CalendarClock className="h-4 w-4" aria-hidden />
            <span>
              Due {formatDate(submission.due_date)}
              {submission.due_date ? (
                <span className="text-muted-foreground/70">
                  {" "}
                  · {formatRelative(submission.due_date)}
                </span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="border-t pt-6">
          <StatusStepper slug={status?.slug} />
        </div>
      </CardContent>
    </Card>
  );
}
