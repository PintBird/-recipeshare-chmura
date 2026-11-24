"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  authError: string;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  authError: "",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    try {
      const supabase = getBrowserSupabaseClient();
      supabase.auth.getUser()
        .then(({ data, error }) => {
          if (!active) return;
          if (error) setAuthError(error.message);
          setUser(data.user);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setAuthError(error instanceof Error ? error.message : "Could not check your sign-in.");
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) {
          setUser(session?.user ?? null);
          setIsLoading(false);
          setAuthError("");
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Google sign-in is unavailable.",
      );
      setIsLoading(false);
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
