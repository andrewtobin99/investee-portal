import Link from "next/link";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { getUser } from "@/lib/supabase/auth";
import {
  getComments,
  getDocuments,
  getExternalVisibilityTypeId,
  getInternalVisibilityTypeId,
  getSubmissionRequest,
  getWorkflowStatuses,
} from "@/lib/supabase/queries";
import { SubmissionHeader } from "@/components/submissions/submission-header";
import { DocumentManager } from "@/components/submissions/document-manager";
import { CommentThread } from "@/components/submissions/comment-thread";
import { StatusChanger } from "@/components/admin/status-changer";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [
    user,
    submission,
    documents,
    comments,
    externalVisibilityTypeId,
    internalVisibilityTypeId,
    statuses,
  ] = await Promise.all([
    getUser(),
    getSubmissionRequest(params.id),
    getDocuments(params.id),
    getComments(params.id),
    getExternalVisibilityTypeId(),
    getInternalVisibilityTypeId(),
    getWorkflowStatuses(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to submissions
        </Link>
        {submission.investees?.company_name ? (
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {submission.investees.company_name}
          </p>
        ) : null}
      </div>

      <SubmissionHeader submission={submission} />

      {/* Admin controls */}
      <Card>
        <CardContent className="p-4">
          <StatusChanger
            submissionId={submission.id}
            currentStatusId={submission.status_id}
            statuses={statuses}
            hasDocuments={documents.length > 0}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
              Documents
            </CardTitle>
            <CardDescription>
              Upload or remove documents for this submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <DocumentManager
                submissionRequestId={submission.id}
                clientId={submission.client_id}
                uploadedBy={user!.id}
                initialDocuments={documents}
                canEdit
                canManageAllDocuments
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
            <CardDescription>
              Reply to the investee, or leave an internal note.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <CommentThread
                submissionRequestId={submission.id}
                currentUserId={user!.id}
                currentUserRole="admin"
                canChooseVisibility
                externalVisibilityTypeId={externalVisibilityTypeId}
                internalVisibilityTypeId={internalVisibilityTypeId}
                initialComments={comments}
              />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
