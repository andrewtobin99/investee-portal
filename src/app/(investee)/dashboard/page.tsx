import { getSubmissionRequests } from "@/lib/supabase/queries";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { SubmissionList } from "@/components/dashboard/submission-list";

export const metadata = { title: "Dashboard · Investee Portal" };

/**
 * Server Component: fetches submissions on the server with the user's session.
 * Any RLS/auth error throws a PortalError which is rendered by error.tsx.
 * The streamed loading UI lives in loading.tsx.
 */
export default async function DashboardPage() {
  const submissions = await getSubmissionRequests();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track and respond to your assigned submission requests.
        </p>
      </div>

      <StatsOverview submissions={submissions} />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Submission requests
        </h2>
        <SubmissionList submissions={submissions} />
      </section>
    </div>
  );
}
