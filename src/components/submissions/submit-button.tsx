"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toAppError } from "@/lib/utils/errors";

/**
 * Lets an investee mark a draft submission as submitted for admin review.
 * Only rendered when the submission is in "draft" status.
 */
export function SubmitButton({
  submissionId,
  submittedStatusId,
}: {
  submissionId: string;
  submittedStatusId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("submission_requests")
      .update({ status_id: submittedStatusId, updated_at: new Date().toISOString() })
      .eq("id", submissionId)
      .select("id");

    setSubmitting(false);

    if (error || !data || data.length === 0) {
      setError(error ? toAppError(error).message : "Unable to submit. Please try again.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Ready to submit?</p>
          <p className="text-xs text-muted-foreground">
            Once submitted, your administrator will be notified to review your documents.
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="shrink-0">
          <Send className="h-4 w-4" />
          {submitting ? "Submitting…" : "Submit for Review"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
