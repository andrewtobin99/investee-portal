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
  initialComments,
}: {
  submissionRequestId: string;
  currentUserId: string;
  externalVisibilityTypeId: string | null;
  initialComments: CommentRecord[];
}) {
  const [comments, setComments] = useState<CommentRecord[]>(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    if (!externalVisibilityTypeId) {
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
      visibility_type_id: externalVisibilityTypeId,
      created_at: new Date().toISOString(),
      author: { id: currentUserId, display_name: "You", role: "investee" },
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
        visibility_type_id: externalVisibilityTypeId,
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
          description="Messages from your administrator will appear here. You can reply at any time."
        />
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const mine = c.author_id === currentUserId;
            const isAdmin = c.author?.role === "admin";
            return (
              <li
                key={c.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card text-foreground",
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        mine ? "text-primary-foreground/90" : "text-foreground",
                      )}
                    >
                      {mine ? "You" : c.author?.display_name || "Administrator"}
                    </span>
                    {isAdmin && !mine ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <ShieldCheck className="h-3 w-3" aria-hidden /> Admin
                      </span>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{c.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
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
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Visible to your administrator · ⌘/Ctrl + Enter to send
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
