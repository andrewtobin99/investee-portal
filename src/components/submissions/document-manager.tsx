"use client";

import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { createClient, DOCUMENTS_BUCKET } from "@/lib/supabase/client";
import { FileUploadZone } from "@/components/submissions/file-upload-zone";
import { DocumentList } from "@/components/submissions/document-list";
import { formatFileSize } from "@/lib/utils/format";
import { toAppError } from "@/lib/utils/errors";
import type { DocumentRecord } from "@/types/database";

interface UploadItem {
  id: string; // local temp id
  file: File;
  status: "uploading" | "success" | "error";
  error?: string;
}

const ACCEPT = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 25 * 1024 * 1024;

/** Sanitise a filename for use in a storage object path. */
function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

/**
 * Upload + manage documents for a submission. Files are stored at
 * `{clientId}/{submissionRequestId}/{timestamp}-{filename}` and tracked in the
 * `documents` table. The investee's user id (uploadedBy) is recorded as the
 * owner so RLS can scope deletes.
 *
 * TODO: the supabase-js upload() call resolves only on completion, so the bar
 *   below is staged (uploading -> done), not byte-accurate. For true progress
 *   switch to resumable TUS uploads (supabase.storage ... .uploadToSignedUrl
 *   with the @supabase/storage-js TUS client) and feed onProgress here.
 */
export function DocumentManager({
  submissionRequestId,
  clientId,
  uploadedBy,
  initialDocuments,
  canEdit = true,
  canManageAllDocuments = false,
}: {
  submissionRequestId: string;
  clientId: string;
  uploadedBy: string;
  initialDocuments: DocumentRecord[];
  canEdit?: boolean;
  /** Admins may delete any file in their client. */
  canManageAllDocuments?: boolean;
}) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [rejections, setRejections] = useState<{ name: string; reason: string }[]>([]);

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      const supabase = createClient();
      const path = `${clientId}/${submissionRequestId}/${Date.now()}-${safeName(item.file.name)}`;

      const { error: uploadErr } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, item.file, {
          contentType: item.file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadErr) {
        setUploads((u) =>
          u.map((x) =>
            x.id === item.id
              ? { ...x, status: "error", error: toAppError(uploadErr).message }
              : x,
          ),
        );
        return;
      }

      // Record metadata. If this fails, roll back the orphaned storage object.
      const { data: row, error: rowErr } = await supabase
        .from("documents")
        .insert({
          submission_request_id: submissionRequestId,
          client_id: clientId,
          file_path: path,
          file_name: item.file.name,
          file_size: item.file.size,
          content_type: item.file.type || null,
          uploaded_by: uploadedBy,
        })
        .select("*")
        .single();

      if (rowErr || !row) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
        setUploads((u) =>
          u.map((x) =>
            x.id === item.id
              ? { ...x, status: "error", error: toAppError(rowErr).message }
              : x,
          ),
        );
        return;
      }

      // Optimistically surface the new document and mark the upload done.
      setDocuments((d) => [row as DocumentRecord, ...d]);
      setUploads((u) =>
        u.map((x) => (x.id === item.id ? { ...x, status: "success" } : x)),
      );
    },
    [clientId, submissionRequestId, uploadedBy],
  );

  const onFiles = useCallback(
    (files: File[]) => {
      setRejections([]);
      const items: UploadItem[] = files.map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        status: "uploading",
      }));
      setUploads((u) => [...items, ...u]);
      items.forEach(uploadOne);
    },
    [uploadOne],
  );

  const onDeleted = useCallback((id: string) => {
    setDocuments((d) => d.filter((doc) => doc.id !== id));
  }, []);

  const dismissUpload = (id: string) =>
    setUploads((u) => u.filter((x) => x.id !== id));

  return (
    <div className="space-y-4">
      {canEdit ? (
        <FileUploadZone
          onFiles={onFiles}
          onReject={setRejections}
          options={{ maxSize: MAX_SIZE, accept: ACCEPT }}
        />
      ) : (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Uploads are closed for this submission in its current status.
        </p>
      )}

      {rejections.length > 0 ? (
        <ul className="space-y-1" role="alert">
          {rejections.map((r) => (
            <li key={r.name} className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span className="font-medium">{r.name}</span>
              <span className="text-muted-foreground">— {r.reason}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* In-flight / recently finished uploads */}
      {uploads.length > 0 ? (
        <ul className="space-y-2">
          {uploads.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={
                      item.status === "uploading"
                        ? "h-full w-1/2 animate-pulse rounded-full bg-primary"
                        : item.status === "success"
                          ? "h-full w-full rounded-full bg-emerald-500"
                          : "h-full w-full rounded-full bg-destructive"
                    }
                  />
                </div>
                {item.status === "error" ? (
                  <p className="mt-1 text-xs text-destructive">{item.error}</p>
                ) : null}
              </div>
              <span className="shrink-0">
                {item.status === "uploading" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : item.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <button
                    onClick={() => dismissUpload(item.id)}
                    aria-label="Dismiss"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <DocumentList
        documents={documents}
        currentUserId={uploadedBy}
        canManageAll={canManageAllDocuments}
        onDeleted={onDeleted}
      />
    </div>
  );
}
