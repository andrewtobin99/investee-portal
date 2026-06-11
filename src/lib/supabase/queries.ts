import { createClient } from "@/lib/supabase/server";
import { PortalError, toAppError } from "@/lib/utils/errors";
import type {
  CommentRecord,
  DocumentRecord,
  SubmissionRequest,
  WorkflowStatus,
} from "@/types/database";

/**
 * Server-side data access for the investee portal. Every query relies on RLS to
 * scope rows to the signed-in investee, so we never pass client_id/investee_id
 * filters for security — only for performance/clarity where helpful.
 */

/** All submission requests assigned to the current investee. */
export async function getSubmissionRequests(): Promise<SubmissionRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("submission_requests")
    .select(
      "*, workflow_statuses(*), investees!inner(id, user_id, client_id, company_name)",
    )
    // RLS already scopes to the user; investees!inner keeps the shape explicit.
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new PortalError(toAppError(error));
  // Cast through unknown: the embedded select shape is wider than our domain type.
  return (data ?? []) as unknown as SubmissionRequest[];
}

/** A single submission request by id (RLS enforces ownership). */
export async function getSubmissionRequest(
  id: string,
): Promise<SubmissionRequest> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("submission_requests")
    .select(
      "*, workflow_statuses(*), investees!inner(id, user_id, client_id, company_name)",
    )
    .eq("id", id)
    .single();

  if (error) throw new PortalError(toAppError(error));
  return data as unknown as SubmissionRequest;
}

/** Document metadata rows for a submission, newest first. */
export async function getDocuments(
  submissionRequestId: string,
): Promise<DocumentRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("submission_request_id", submissionRequestId)
    .order("created_at", { ascending: false });

  if (error) throw new PortalError(toAppError(error));
  return (data ?? []) as DocumentRecord[];
}

/**
 * Comments visible to the investee for a submission.
 *
 * Investees only ever see externally-visible comments — RLS enforces this, so
 * we don't filter on visibility here; whatever comes back is allowed. We join
 * author info so the thread can label admin vs investee messages.
 *
 * TODO: confirm the exact author-join column names against the live schema.
 * This assumes a `comment_author` view/relation exposing display_name + role.
 */
export async function getComments(
  submissionRequestId: string,
): Promise<CommentRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:comment_author(id, display_name, role)")
    .eq("submission_request_id", submissionRequestId)
    .order("created_at", { ascending: true });

  if (error) throw new PortalError(toAppError(error));
  return (data ?? []) as unknown as CommentRecord[];
}

/**
 * The visibility type id for "external" comments. Investee-authored comments
 * must be external so admins can see them.
 *
 * TODO: cache this or inline a known UUID once the lookup table is stable.
 */
export async function getExternalVisibilityTypeId(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comment_visibility_types")
    .select("id")
    .eq("slug", "external")
    .maybeSingle();
  if (error) return null;
  return (data?.id as string) ?? null;
}

/** The visibility type id for "internal" (admin-only) comments. */
export async function getInternalVisibilityTypeId(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comment_visibility_types")
    .select("id")
    .eq("slug", "internal")
    .maybeSingle();
  if (error) return null;
  return (data?.id as string) ?? null;
}

/** All workflow statuses ordered for the admin status picker. */
export async function getWorkflowStatuses(): Promise<WorkflowStatus[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workflow_statuses")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new PortalError(toAppError(error));
  return (data ?? []) as unknown as WorkflowStatus[];
}
