/**
 * Normalises Supabase / PostgREST / Storage errors into something the UI can
 * branch on. RLS denials surface as 401 (unauthenticated) or 403 (forbidden);
 * everything else is treated as a recoverable "network/unknown" error with a
 * retry affordance.
 */

export type AppErrorKind = "unauthenticated" | "forbidden" | "not_found" | "network";

export interface AppError {
  kind: AppErrorKind;
  message: string;
  /** Original error, kept for logging. */
  cause?: unknown;
}

interface SupabaseLikeError {
  message?: string;
  status?: number;
  statusCode?: number | string;
  code?: string;
}

export function toAppError(error: unknown): AppError {
  const e = (error ?? {}) as SupabaseLikeError;
  const status = Number(e.status ?? e.statusCode ?? 0);
  const message = e.message ?? "Something went wrong.";

  if (status === 401) {
    return { kind: "unauthenticated", message: "Your session has expired.", cause: error };
  }
  if (status === 403 || e.code === "42501" /* insufficient_privilege */) {
    return {
      kind: "forbidden",
      message: "You don't have permission to view this.",
      cause: error,
    };
  }
  if (status === 404 || e.code === "PGRST116") {
    return { kind: "not_found", message: "We couldn't find that item.", cause: error };
  }
  return { kind: "network", message, cause: error };
}

/** Thrown by server components so the nearest error boundary can render it. */
export class PortalError extends Error {
  kind: AppErrorKind;
  constructor(appError: AppError) {
    super(appError.message);
    this.name = "PortalError";
    this.kind = appError.kind;
  }
}
