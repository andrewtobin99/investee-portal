"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Browser Supabase client. Safe to call in client components; the underlying
 * library memoises a single instance per browser context.
 *
 * Use this for interactive operations: uploads, deletes, optimistic comment
 * inserts, and (future) realtime subscriptions.
 */
// @supabase/ssr@0.5 forwards generics positionally into SupabaseClient, but
// supabase-js@2.108 reordered those slots, scrambling the schema type. We let
// ssr build the client untyped and re-assert the correct typed shape here.
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as unknown as SupabaseClient<Database>;
}

export const DOCUMENTS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_DOCUMENTS_BUCKET ?? "submission-documents";
