import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getUser, getCurrentInvestee, getUserRole } from "@/lib/supabase/auth";
import { UserMenu } from "@/components/dashboard/user-menu";

/**
 * Authenticated shell for all investee routes. The middleware already blocks
 * unauthenticated access, but we re-check here (defence in depth) and use the
 * result to populate the header.
 *
 * This layout is the seam for future role-based routing: an admin shell would
 * live under a sibling route group (e.g. (admin)/layout.tsx) with its own nav.
 */
export default async function InvesteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  // Investee-only route group. A signed-in user with no investee record is
  // routed by role: admins to their portal, everyone else to /no-access.
  const investee = await getCurrentInvestee();
  if (!investee) {
    const role = await getUserRole();
    redirect(role === "admin" ? "/admin/dashboard" : "/no-access");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" aria-hidden />
            </span>
            <span>Investee Portal</span>
          </Link>
          <UserMenu email={user.email ?? ""} name={investee?.company_name} />
        </div>
      </header>

      <main className="container py-8">{children}</main>
    </div>
  );
}
