"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { toAppError } from "@/lib/utils/errors";
import type { WorkflowStatus } from "@/types/database";

/**
 * Admin control to change a submission's status. Updates `status_id`; the DB
 * trigger records the change in submission_status_history. We confirm a row was
 * actually updated (RLS may filter) before reflecting it, then refresh the
 * server components so the header/stepper re-render.
 */
export function StatusChanger({
  submissionId,
  currentStatusId,
  statuses,
  hasDocuments,
}: {
  submissionId: string;
  currentStatusId: string;
  statuses: WorkflowStatus[];
  /** When false, changing to "approved" is blocked until a file is uploaded. */
  hasDocuments: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentStatusId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approvedStatusId = statuses.find((s) => s.slug === "approved")?.id;

  async function onChange(next: string) {
    if (next === value || saving) return;

    if (next === approvedStatusId && !hasDocuments) {
      setError("At least one document must be uploaded before approving this submission.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("submission_requests")
      .update({ status_id: next, updated_at: new Date().toISOString() })
      .eq("id", submissionId)
      .select("id");

    setSaving(false);

    if (error || !data || data.length === 0) {
      setError(
        error
          ? toAppError(error).message
          : "You don't have permission to change this status.",
      );
      return;
    }
    setValue(next);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="status" className="text-sm font-medium">
        Status
      </label>
      <div className="relative">
        <select
          id="status"
          value={value}
          disabled={saving}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-9 appearance-none rounded-md border border-input bg-card pl-3 pr-8 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:opacity-60",
          )}
        >
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground"
          aria-hidden
        />
      </div>
      {saving ? <Spinner /> : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
