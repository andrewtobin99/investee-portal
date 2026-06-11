"use client";

import { RouteError } from "@/components/shared/route-error";
import type { AppErrorKind } from "@/lib/utils/errors";

export default function AdminError(props: {
  error: Error & { kind?: AppErrorKind; digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} homePath="/admin/dashboard" />;
}
