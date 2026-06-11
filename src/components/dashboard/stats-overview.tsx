import { Clock, AlertTriangle, CheckCircle2, FileStack } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { isOverdue } from "@/lib/utils/format";
import type { SubmissionRequest } from "@/types/database";

/** Derive headline counts from the submission list (no extra round-trip). */
function computeStats(submissions: SubmissionRequest[]) {
  let pending = 0;
  let overdue = 0;
  let approved = 0;

  for (const s of submissions) {
    const slug = s.workflow_statuses?.slug;
    const open = slug !== "approved" && slug !== "rejected";
    if (open) pending += 1;
    if (open && isOverdue(s.due_date)) overdue += 1;
    if (slug === "approved") approved += 1;
  }
  return { total: submissions.length, pending, overdue, approved };
}

export function StatsOverview({
  submissions,
}: {
  submissions: SubmissionRequest[];
}) {
  const stats = computeStats(submissions);

  const items = [
    { label: "Total requests", value: stats.total, icon: FileStack, tone: "text-slate-600" },
    { label: "Pending", value: stats.pending, icon: Clock, tone: "text-blue-600" },
    { label: "Overdue", value: stats.overdue, icon: AlertTriangle, tone: "text-red-600" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, tone: "text-emerald-600" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-xl font-semibold tabular-nums">{value}</dd>
            </div>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}
