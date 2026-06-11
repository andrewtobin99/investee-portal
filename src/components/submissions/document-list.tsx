"use client";

import { useState } from "react";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { createClient, DOCUMENTS_BUCKET } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime, formatFileSize } from "@/lib/utils/format";
import { toAppError } from "@/lib/utils/errors";
import type { DocumentRecord } from "@/types/database";

/**
 * Renders uploaded documents with download (signed URL) and delete actions.
 * Download and delete are per-row so we track in-flight state by document id.
 */
export function DocumentList({
  documents,
  currentUserId,
  onDeleted,
}: {
  documents: DocumentRecord[];
  /** Used to gate the delete affordance to files the user uploaded. */
  currentUserId: string;
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState<Record<string, "download" | "delete">>({});
  const [error, setError] = useState<string | null>(null);

  async function download(doc: DocumentRecord) {
    setError(null);
    setBusy((b) => ({ ...b, [doc.id]: "download" }));
    const supabase = createClient();
    // Signed URLs expire (1h here) so private objects are never publicly exposed.
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(doc.file_path, 3600, { download: doc.file_name });

    setBusy((b) => {
      const next = { ...b };
      delete next[doc.id];
      return next;
    });

    if (error || !data?.signedUrl) {
      setError(toAppError(error).message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove(doc: DocumentRecord) {
    if (!confirm(`Delete "${doc.file_name}"? This can't be undone.`)) return;
    setError(null);
    setBusy((b) => ({ ...b, [doc.id]: "delete" }));
    const supabase = createClient();

    // Delete the metadata row first and ASK FOR THE DELETED ROW BACK. A delete
    // blocked by RLS returns no error and zero rows, so checking `error` alone
    // would falsely report success — we must confirm a row was actually removed.
    const { data: deleted, error: rowErr } = await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id)
      .select("id");

    if (rowErr || !deleted || deleted.length === 0) {
      setBusy((b) => {
        const next = { ...b };
        delete next[doc.id];
        return next;
      });
      setError(
        rowErr
          ? toAppError(rowErr).message
          : "You don't have permission to delete this file.",
      );
      return; // leave the row in the list — it was not deleted
    }

    // Row is gone; best-effort removal of the underlying object (owner-scoped
    // by storage RLS). An orphaned object here is harmless and reapable later.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.file_path]);

    setBusy((b) => {
      const next = { ...b };
      delete next[doc.id];
      return next;
    });
    onDeleted(doc.id);
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="No documents uploaded"
        description="Upload the files requested for this submission using the area above."
      />
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="divide-y rounded-lg border bg-card">
        {documents.map((doc) => {
          const state = busy[doc.id];
          return (
            <li key={doc.id} className="flex items-center gap-3 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(doc.file_size)} · {formatDateTime(doc.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Download ${doc.file_name}`}
                  onClick={() => download(doc)}
                  disabled={!!state}
                >
                  {state === "download" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                {doc.uploaded_by === currentUserId ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${doc.file_name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove(doc)}
                    disabled={!!state}
                  >
                    {state === "delete" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
