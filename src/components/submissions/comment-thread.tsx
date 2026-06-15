"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import { toAppError } from "@/lib/utils/errors";
import type { CommentRecord } from "@/types/database";

/**
 * External comment thread. Investees see admin + their own external comments
 * (RLS filters internal-only notes) and can reply. New comments are inserted
 * with the external visibility type so admins can read them.
 *
 * Live updates: a Realtime subscription appends comments inserted by others
 * (e.g. an admin's follow-up) without a refresh. We never trust the broadcast
 * payload for content — on each event we re-fetch the row through a normal
 * query so RLS decides visibility, then append it. Requires `comments` to be in
 * the `supabase_realtime` publication (see supabase/setup.sql).
 */
export function CommentThread({
  submissionRequestId,
  currentUserId,
  externalVisibilityTypeId,
  internalVisibilityTypeId = null,
  initialComments,
  currentUserRole = "investee",
  canChooseVisibility = false,
}: {
  submissionRequestId: string;
  currentUserId: string;
  externalVisibilityTypeId: string | null;
  /** Required for admins posting internal notes. */
  internalVisibilityTypeId?: string | null;
  initialComments: CommentRecord[];
  /** Role of the signed-in user, for optimistic author labelling. */
  currentUserRole?: "investee" | "admin";
  /** Admins may choose external (investee-visible) vs internal (admin-only). */
  canChooseVisibility?: boolean;
}) {
  const [comments, setComments] = useState<CommentRecord[]>(initialComments);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"external" | "internal">("external");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isInternal = canChooseVisibility && visibility === "internal";

  // Realtime: append comments authored by others as they arrive.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${submissionRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `submission_request_id=eq.${submissionRequestId}`,
        },
        async (payload) => {
          const incoming = payload.new as { id: string; author_id: string };
          // Our own inserts are reconciled by submit(); skip them here.
          if (incoming.author_id === currentUserId) return;

          // Re-fetch through a normal query so RLS gates visibility (the
          // broadcast itself may not). If RLS hides it, data is null -> ignore.
          const { data } = await supabase
            .from("comments")
            .select("*, author:comment_author(id, display_name, role)")
            .eq("id", incoming.id)
            .maybeSingle();
          if (!data) return;

          setComments((c) =>
            c.some((x) => x.id === incoming.id)
              ? c
              : [...c, data as unknown as CommentRecord],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionRequestId, currentUserId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || submitting) return;

    const visibilityTypeId = isInternal
      ? internalVisibilityTypeId
      : externalVisibilityTypeId;
    if (!visibilityTypeId) {
      setError("Comment visibility isn't configured. Contact your administrator.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Optimistic insert.
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: CommentRecord = {
      id: tempId,
      submission_request_id: submissionRequestId,
      author_id: currentUserId,
      body: text,
      visibility_type_id: visibilityTypeId,
      created_at: new Date().toISOString(),
      author: { id: currentUserId, display_name: "You", role: currentUserRole },
    };
    setComments((c) => [...c, optimistic]);
    setBody("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        submission_request_id: submissionRequestId,
        author_id: currentUserId,
        body: text,
        visibility_type_id: visibilityTypeId,
      })
      .select("*, author:comment_author(id, display_name, role)")
      .single();

    setSubmitting(false);

    if (error || !data) {
      // Roll back optimistic insert and restore the draft.
      setComments((c) => c.filter((x) => x.id !== tempId));
      setBody(text);
      setError(toAppError(error).message);
      return;
    }
    setComments((c) =>
      c.map((x) => (x.id === tempId ? (data as unknown as CommentRecord) : x)),
    );
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <EmptyState
          title="No comments yet"
          description={
            currentUserRole === "admin"
              ? "Start the conversation, or leave an internal note for your team."
              : "Messages from your administrator will appear here. You can reply at any time."
          }
        />
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const mine = c.author_id === currentUserId;
            const isAdmin = c.author?.role === "admin";
            // Only admins ever see internal comments (RLS), so only flag them there.
            const internal =
              canChooseVisibility && c.visibility_type_id === internalVisibilityTypeId;
            return (
              <li
                key={c.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    internal
                      ? "border border-[#E3D5F2] bg-[#F6F1FC] text-foreground"
                      : mine
                        ? "bg-primary text-primary-foreground"
                        : "border bg-card text-foreground",
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        mine && !internal
                          ? "text-primary-foreground/90"
                          : "text-foreground",
                      )}
                    >
                      {mine
                        ? "You"
                        : c.author?.display_name ||
                          (isAdmin ? "Administrator" : "Investee")}
                    </span>
                    {isAdmin && !mine ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#EEEAF6] px-1.5 py-0.5 text-[10px] font-medium text-[#6D30A7]">
                        <ShieldCheck className="h-3 w-3" aria-hidden /> Admin
                      </span>
                    ) : null}
                    {internal ? (
                      <span className="rounded-full bg-[#EEE7F7] px-1.5 py-0.5 text-[10px] font-medium text-[#6D30A7]">
                        Internal
                      </span>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{c.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine && !internal
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatDateTime(c.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-2">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
          }}
          rows={3}
          placeholder="Write a reply…"
          aria-label="Add a comment"
          className="flex w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {canChooseVisibility ? (
          <div
            role="radiogroup"
            aria-label="Comment visibility"
            className="inline-flex rounded-md border p-0.5 text-xs"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!isInternal}
              onClick={() => setVisibility("external")}
              className={cn(
                "rounded px-2 py-1 font-medium",
                !isInternal ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              External
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isInternal}
              onClick={() => setVisibility("internal")}
              className={cn(
                "rounded px-2 py-1 font-medium",
                isInternal ? "bg-[#6D30A7] text-white" : "text-muted-foreground",
              )}
            >
              Internal
            </button>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {currentUserRole === "admin"
              ? isInternal
                ? "Internal note — the investee can't see this"
                : "Visible to the investee"
              : "Visible to your administrator"}{" "}
            · ⌘/Ctrl + Enter to send
          </span>
          <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
            <Send className="h-4 w-4" />
            {submitting ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
