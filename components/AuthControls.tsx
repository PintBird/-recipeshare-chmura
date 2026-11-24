"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { getUserDisplayName } from "@/lib/user";

export default function AuthControls() {
  const { user, isLoading, authError } = useAuth();
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    try {
      const supabase = getBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signInError) throw signInError;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not start Google sign-in.");
    }
  }

  async function signOut() {
    setError("");
    try {
      const { error: signOutError } = await getBrowserSupabaseClient().auth.signOut();
      if (signOutError) throw signOutError;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not sign out.");
    }
  }

  if (isLoading) return <span className="auth-loading">Checking sign-in…</span>;
  if (!user) {
    return (
      <div className="auth-control">
        <button className="sign-in-button" type="button" onClick={signIn}>
          Sign in with Google
        </button>
        {(error || authError) && <span className="auth-error" role="alert">{error || authError}</span>}
      </div>
    );
  }

  const name = getUserDisplayName(user) || "My account";

  return (
    <div className="auth-control">
      <Link className="profile-link" href="/profile">{name}</Link>
      <button className="sign-out-button" type="button" onClick={signOut}>Sign out</button>
      {error && <span className="auth-error" role="alert">{error}</span>}
    </div>
  );
}
