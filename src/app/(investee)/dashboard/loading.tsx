import { Skeleton } from "@/components/ui/skeleton";

/** Streamed instantly while the dashboard server component fetches data. */
export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full" />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full" />
        ))}
      </div>
    </div>
  );
}
