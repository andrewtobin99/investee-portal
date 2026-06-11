import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server Supabase client for Server Components, Route Handlers, and Server
 * Actions. Reads/writes the auth session from Next's cookie store so RLS runs
 * as the signed-in user.
 *
 * Note: in a pure Server Component the cookie store is read-only, so the
 * `set`/`remove` writes are wrapped in try/catch. Session refresh is handled by
 * the middleware (see src/lib/supabase/middleware.ts), so the no-op here is safe.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware refreshes the session.
          }
        },
      },
    },
  ) as unknown as SupabaseClient<Database>;
}
