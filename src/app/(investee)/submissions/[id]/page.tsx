import Link from "next/link";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { getUser } from "@/lib/supabase/auth";
import {
  getComments,
  getDocuments,
  getExternalVisibilityTypeId,
  getSubmissionRequest,
} from "@/lib/supabase/queries";
import { SubmissionHeader } from "@/components/submissions/submission-header";
import { DocumentManager } from "@/components/submissions/document-manager";
import { CommentThread } from "@/components/submissions/comment-thread";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Statuses after which uploads are locked (a decision has been made). */
const LOCKED_STATUSES = new Set(["approved", "rejected"]);

export default async function SubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetched in parallel; each throws a PortalError handled by error.tsx.
  const [user, submission, documents, comments, externalVisibilityTypeId] =
    await Promise.all([
      getUser(),
      getSubmissionRequest(params.id),
      getDocuments(params.id),
      getComments(params.id),
      getExternalVisibilityTypeId(),
    ]);

  const slug = submission.workflow_statuses?.slug;
  const canEdit = !LOCKED_STATUSES.has(slug ?? "");

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to dashboard
      </Link>

      <SubmissionHeader submission={submission} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
              Documents
            </CardTitle>
            <CardDescription>
              Upload the files requested for this submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <DocumentManager
                submissionRequestId={submission.id}
                clientId={submission.client_id}
                uploadedBy={user!.id}
                initialDocuments={documents}
                canEdit={canEdit}
              />
            </ErrorBoundary>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden />
              Comments
            </CardTitle>
            <CardDescription>Messages with your administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <CommentThread
                submissionRequestId={submission.id}
                currentUserId={user!.id}
                externalVisibilityTypeId={externalVisibilityTypeId}
                initialComments={comments}
              />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
