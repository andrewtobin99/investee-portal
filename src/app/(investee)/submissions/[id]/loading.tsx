import { Skeleton } from "@/components/ui/skeleton";

export default function SubmissionLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-44 w-full rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 w-full rounded-lg lg:col-span-3" />
        <Skeleton className="h-80 w-full rounded-lg lg:col-span-2" />
      </div>
    </div>
  );
}
