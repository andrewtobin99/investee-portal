import { createClient } from "@/lib/supabase/server";
import type { Investee } from "@/types/database";

/**
 * Server-side auth helpers. These resolve the authenticated user and the
 * investee record that scopes everything the portal shows.
 *
 * Roles are resolved from DB tables (user_client_roles), not JWT claims, so we
 * derive the investee context from the `investees` table joined on user_id.
 */

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Resolve the investee record for the current user. Returns null if the user
 * isn't linked to an investee (e.g. an admin-only account). RLS guarantees a
 * user can only ever read their own investee row.
 */
export async function getCurrentInvestee(): Promise<Investee | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("investees")
    .select("id, user_id, client_id, company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // Swallow here; callers decide how to surface. Most reads will simply
    // return empty because RLS prevents seeing anything without an investee.
    return null;
  }
  // Partial column selection; cast through unknown to our domain type.
  return data as unknown as Investee | null;
}
