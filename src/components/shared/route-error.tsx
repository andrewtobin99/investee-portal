"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppErrorKind } from "@/lib/utils/errors";

/**
 * Shared route-level error UI. Branches on the PortalError `kind`: 401 -> re-auth,
 * 403 -> permission denied, everything else -> retry. Used by each route group's
 * error.tsx; `homePath` is where the "back" action returns to.
 */
export function RouteError({
  error,
  reset,
  homePath = "/dashboard",
}: {
  error: Error & { kind?: AppErrorKind; digest?: string };
  reset: () => void;
  homePath?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    // TODO: report to monitoring.
    console.error(error);
  }, [error]);

  const kind = error.kind ?? "network";

  if (kind === "unauthenticated") {
    return (
      <Panel
        icon={<Lock className="h-6 w-6 text-primary" />}
        title="Your session has expired"
        description="Please sign in again to continue."
        action={<Button onClick={() => router.replace("/login")}>Go to sign in</Button>}
      />
    );
  }

  if (kind === "forbidden") {
    return (
      <Panel
        icon={<Lock className="h-6 w-6 text-destructive" />}
        title="You don't have permission"
        description="You're not allowed to view this resource. If you think this is a mistake, contact your administrator."
        action={
          <Button variant="outline" onClick={() => router.replace(homePath)}>
            Back
          </Button>
        }
      />
    );
  }

  return (
    <Panel
      icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
      title="Something went wrong"
      description={error.message || "We couldn't load this page. Please try again."}
      action={
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      }
    />
  );
}

function Panel({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}
