import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, getCurrentInvestee, getUserRole } from "@/lib/supabase/auth";
import { BrandMark } from "@/components/shared/brand-logo";
import { UserMenu } from "@/components/dashboard/user-menu";

/**
 * Authenticated shell for all investee routes. The middleware already blocks
 * unauthenticated access, but we re-check here (defence in depth) and use the
 * result to populate the header.
 */
export default async function InvesteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const investee = await getCurrentInvestee();
  if (!investee) {
    const role = await getUserRole();
    redirect(role === "admin" ? "/admin/dashboard" : "/no-access");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <BrandMark size={26} />
            <span className="text-[17px] font-bold tracking-tight">Camco</span>
            <span className="h-5 w-px bg-border" aria-hidden />
            <span className="text-sm font-medium text-muted-foreground">
              Investee Portal
            </span>
          </Link>
          <UserMenu email={user.email ?? ""} name={investee?.company_name} />
        </div>
      </header>

      <main className="container py-8">{children}</main>
    </div>
  );
}
