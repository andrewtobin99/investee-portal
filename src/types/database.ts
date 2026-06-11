/**
 * Hand-written types describing the slice of the Supabase schema the investee
 * portal touches.
 *
 * TODO: Replace this file with generated types once the team wires up
 *   `supabase gen types typescript --project-id <ref> > src/types/supabase.ts`
 *   and re-export the relevant rows from there. Keeping these hand-written
 *   types small and explicit until then avoids drift in the parts we use.
 */

/** Canonical workflow status slugs. Mirrors `workflow_statuses.slug`. */
export type WorkflowStatusSlug =
  | "draft"
  | "submitted"
  | "under_review"
  | "follow_up_requested"
  | "approved"
  | "rejected";

export interface WorkflowStatus {
  id: string;
  /** Stable machine key used for colour/order mapping on the client. */
  slug: WorkflowStatusSlug;
  /** Human-readable label, e.g. "Under review". */
  label: string;
  /** Ordering hint for the status stepper (0-based). */
  sort_order: number;
}

export interface Investee {
    id: string;
    user_id: string;
    client_id: string;
    company_name: string; 
    contact_person: string | null;
    contact_email: string | null;
    country: string | null;
    industry: string | null;
    status: string;
    metadata: any;
    onboarded_at: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface SubmissionRequest {
  id: string;
  client_id: string;
  investee_id: string;
  title: string;
  description: string | null;
  due_date: string | null; // ISO date string
  status_id: string;
  created_at: string;
  updated_at: string | null;
  /** Populated when selected with `workflow_statuses(*)`. */
  workflow_statuses?: WorkflowStatus | null;
}

export interface DocumentRecord {
  id: string;
  submission_request_id: string;
  client_id: string;
  /** Storage object path: `{client_id}/{submission_request_id}/{filename}`. */
  file_path: string;
  file_name: string;
  file_size: number;
  content_type: string | null;
  uploaded_by: string;
  created_at: string;
}

/** Mirrors a row in a `comment_visibility_types` lookup, if present. */
export type CommentVisibility = "external" | "internal";

export interface CommentAuthor {
  id: string;
  display_name: string | null;
  /** "investee" | "admin" — resolved server-side from user_client_roles. */
  role: "investee" | "admin";
}

export interface CommentRecord {
  id: string;
  submission_request_id: string;
  author_id: string;
  body: string;
  visibility_type_id: string;
  created_at: string;
  /** Joined/derived author info for rendering. */
  author?: CommentAuthor | null;
}
