import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign out via a POST route so it can be triggered from a plain form/button in
 * a Server Component without shipping client JS. Clears the session cookies and
 * redirects to /login.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
