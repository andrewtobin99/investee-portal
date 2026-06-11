import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getInvestees, getWorkflowStatuses } from "@/lib/supabase/queries";
import { NewSubmissionForm } from "@/components/admin/new-submission-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "New request · Admin" };

// Static segment `new` takes precedence over the sibling `[id]` route.
export default async function NewSubmissionPage() {
  const [investees, statuses] = await Promise.all([
    getInvestees(),
    getWorkflowStatuses(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to submissions
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New submission request</CardTitle>
          <CardDescription>
            Assign a reporting request to one of your investees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewSubmissionForm investees={investees} statuses={statuses} />
        </CardContent>
      </Card>
    </div>
  );
}
