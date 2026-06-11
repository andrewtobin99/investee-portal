"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { toAppError } from "@/lib/utils/errors";
import type { WorkflowStatus } from "@/types/database";

type InvesteeOption = { id: string; company_name: string; client_id: string };

const selectClass = cn(
  "h-10 w-full appearance-none rounded-md border border-input bg-card pl-3 pr-8 text-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:opacity-60",
);

/**
 * Admin form to create a submission request for one of their investees. The
 * chosen investee carries its client_id, which we set on the new row so the
 * insert satisfies the `is_client_admin(client_id)` RLS check.
 */
export function NewSubmissionForm({
  investees,
  statuses,
}: {
  investees: InvesteeOption[];
  statuses: WorkflowStatus[];
}) {
  const router = useRouter();
  const defaultStatus =
    statuses.find((s) => s.slug === "draft") ?? statuses[0];

  const [investeeId, setInvesteeId] = useState(investees[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [statusId, setStatusId] = useState(defaultStatus?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (investees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You have no investees to assign a request to yet.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || !investeeId || submitting) return;

    const investee = investees.find((i) => i.id === investeeId);
    if (!investee) {
      setError("Please choose an investee.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("submission_requests")
      .insert({
        client_id: investee.client_id,
        investee_id: investee.id,
        title: t,
        description: description.trim() || null,
        due_date: dueDate || null,
        status_id: statusId,
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setError(toAppError(error).message);
      return;
    }
    router.push(`/admin/submissions/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="investee" className="text-sm font-medium">
          Investee
        </label>
        <div className="relative">
          <select
            id="investee"
            value={investeeId}
            onChange={(e) => setInvesteeId(e.target.value)}
            disabled={submitting}
            className={selectClass}
          >
            {investees.map((i) => (
              <option key={i.id} value={i.id}>
                {i.company_name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q3 2026 Financial Statements"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should the investee provide?"
          className="flex w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="due" className="text-sm font-medium">
            Due date <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Initial status
          </label>
          <div className="relative">
            <select
              id="status"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              disabled={submitting}
              className={selectClass}
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Link
          href="/admin/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? <Spinner className="text-primary-foreground" /> : null}
          {submitting ? "Creating…" : "Create request"}
        </Button>
      </div>
    </form>
  );
}
