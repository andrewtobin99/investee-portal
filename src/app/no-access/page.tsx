import { ShieldAlert } from "lucide-react";

export const metadata = { title: "No access · Investee Portal" };

/**
 * Shown to an authenticated user who has no investee record (e.g. an admin).
 * Sits outside the (investee) route group so the investee-only layout guard
 * doesn't redirect into a loop. The middleware still requires authentication
 * to reach this page.
 */
export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold">This portal is for investees</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account isn&apos;t linked to an investee profile, so there&apos;s
          nothing to show here. If you think this is a mistake, contact your
          administrator.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
