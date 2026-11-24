import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    console.error("Could not complete Google sign-in.", error);
  }

  return NextResponse.redirect(new URL("/profile?authError=sign-in", request.url));
}
