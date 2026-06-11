import { Inbox } from "lucide-react";
import { SubmissionCard } from "@/components/dashboard/submission-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { SubmissionRequest } from "@/types/database";

export function SubmissionList({
  submissions,
}: {
  submissions: SubmissionRequest[];
}) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-5 w-5" aria-hidden />}
        title="No submissions yet"
        description="When your administrator assigns a submission request, it will appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {submissions.map((s) => (
        <li key={s.id}>
          <SubmissionCard submission={s} />
        </li>
      ))}
    </ul>
  );
}
