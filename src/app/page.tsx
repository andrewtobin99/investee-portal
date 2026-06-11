import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/supabase/auth";

/**
 * Role-aware entry point. The middleware guarantees the user is authenticated
 * before they reach here; we then route to the right portal by DB role.
 */
export default async function RootPage() {
  const role = await getUserRole();
  if (role === "admin") redirect("/admin/dashboard");
  if (role === "investee") redirect("/dashboard");
  redirect("/no-access");
}
