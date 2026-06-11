import Link from "next/link";
import { Plus } from "lucide-react";
import { getSubmissionRequests } from "@/lib/supabase/queries";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { SubmissionList } from "@/components/dashboard/submission-list";
import { STATUS_CONFIG } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { WorkflowStatusSlug } from "@/types/database";

export const metadata = { title: "Admin · Investee Portal" };

const FILTERS: { slug: WorkflowStatusSlug; label: string }[] = (
  [
    "draft",
    "submitted",
    "under_review",
    "follow_up_requested",
    "approved",
    "rejected",
  ] as WorkflowStatusSlug[]
).map((slug) => ({ slug, label: STATUS_CONFIG[slug].label }));

/**
 * Admin dashboard: every submission across the investees in the admin's
 * client(s) (RLS scopes the rows). Filterable by status via ?status=<slug>.
 */
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const all = await getSubmissionRequests();
  const active = searchParams.status;
  const submissions = active
    ? all.filter((s) => s.workflow_statuses?.slug === active)
    : all;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage submission requests across your investees.
          </p>
        </div>
        <Link href="/admin/submissions/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4" /> New request
        </Link>
      </div>

      <StatsOverview submissions={all} />

      <section className="space-y-3">
        {/* Status filter */}
        <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
          <FilterChip href="/admin/dashboard" label="All" active={!active} />
          {FILTERS.map((f) => (
            <FilterChip
              key={f.slug}
              href={`/admin/dashboard?status=${f.slug}`}
              label={f.label}
              active={active === f.slug}
            />
          ))}
        </nav>

        <SubmissionList
          submissions={submissions}
          basePath="/admin/submissions"
          showCompany
          emptyTitle={active ? "No submissions in this status" : "No submissions yet"}
          emptyDescription={
            active
              ? "Try a different status filter."
              : "Submissions assigned to your investees will appear here."
          }
        />
      </section>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
