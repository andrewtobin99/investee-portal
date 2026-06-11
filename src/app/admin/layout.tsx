import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import {
  getUser,
  getUserRole,
  getProfileDisplayName,
} from "@/lib/supabase/auth";
import { UserMenu } from "@/components/dashboard/user-menu";

/**
 * Authenticated shell for admin routes. Mirrors the investee layout but gates
 * to admins: investees are sent to their portal, everyone else to /no-access.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const role = await getUserRole();
  if (role !== "admin") {
    redirect(role === "investee" ? "/dashboard" : "/no-access");
  }

  const name = await getProfileDisplayName();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" aria-hidden />
            </span>
            <span>Investee Portal</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Admin
            </span>
          </Link>
          <UserMenu email={user.email ?? ""} name={name} />
        </div>
      </header>

      <main className="container py-8">{children}</main>
    </div>
  );
}
