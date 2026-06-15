import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getUser,
  getUserRole,
  getProfileDisplayName,
} from "@/lib/supabase/auth";
import { BrandMark } from "@/components/shared/brand-logo";
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
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <BrandMark size={26} />
            <span className="text-[17px] font-bold tracking-tight">Camco</span>
            <span className="h-5 w-px bg-border" aria-hidden />
            <span className="text-sm font-medium text-muted-foreground">
              Investee Portal
            </span>
            <span className="rounded-full bg-[#EEEAF6] px-2 py-0.5 text-xs font-bold tracking-wide text-[#6D30A7]">
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
