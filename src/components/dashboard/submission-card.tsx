import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelative, isOverdue } from "@/lib/utils/format";
import type { SubmissionRequest } from "@/types/database";

export function SubmissionCard({
  submission,
  basePath = "/submissions",
  showCompany = false,
}: {
  submission: SubmissionRequest;
  /** Detail-route base; admin views pass "/admin/submissions". */
  basePath?: string;
  /** Show the investee company name (admin views). */
  showCompany?: boolean;
}) {
  const status = submission.workflow_statuses;
  const open = status?.slug !== "approved" && status?.slug !== "rejected";
  const overdue = open && isOverdue(submission.due_date);

  return (
    <Link
      href={`${basePath}/${submission.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="group transition-colors hover:border-primary/40 hover:bg-muted/30">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge slug={status?.slug} label={status?.label} />
              {overdue ? (
                <span className="text-xs font-medium text-red-600">Overdue</span>
              ) : null}
            </div>
            {showCompany && submission.investees?.company_name ? (
              <p className="mt-1.5 truncate text-xs font-medium text-muted-foreground">
                {submission.investees.company_name}
              </p>
            ) : null}
            <h3 className="mt-1.5 truncate font-medium">{submission.title}</h3>
            {submission.description ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {submission.description}
              </p>
            ) : null}
            <p
              className={cn(
                "mt-2 flex items-center gap-1.5 text-xs",
                overdue ? "text-red-600" : "text-muted-foreground",
              )}
            >
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              Due {formatDate(submission.due_date)}
              {submission.due_date ? (
                <span className="text-muted-foreground/70">
                  · {formatRelative(submission.due_date)}
                </span>
              ) : null}
            </p>
          </div>
          <ArrowRight
            className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  );
}
