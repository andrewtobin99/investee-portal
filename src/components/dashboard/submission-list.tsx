import { Inbox } from "lucide-react";
import { SubmissionCard } from "@/components/dashboard/submission-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { SubmissionRequest } from "@/types/database";

export function SubmissionList({
  submissions,
  basePath,
  showCompany,
  emptyTitle = "No submissions yet",
  emptyDescription = "When your administrator assigns a submission request, it will appear here.",
}: {
  submissions: SubmissionRequest[];
  basePath?: string;
  showCompany?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-5 w-5" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {submissions.map((s) => (
        <li key={s.id}>
          <SubmissionCard submission={s} basePath={basePath} showCompany={showCompany} />
        </li>
      ))}
    </ul>
  );
}
