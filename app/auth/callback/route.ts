import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the emailed recovery code for a session, then continues to `next`.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const tokenHash = req.nextUrl.searchParams.get("token_hash");
  const supabase = await createClient();

  // token_hash works from any browser (needed when an admin triggers the mail);
  // code needs the PKCE verifier from the browser that requested the reset.
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(target, req.url));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(target, req.url));
  }
  return NextResponse.redirect(new URL("/login", req.url));
}
