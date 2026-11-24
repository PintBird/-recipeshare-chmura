import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User): string {
  for (const key of ["full_name", "name"]) {
    const value: unknown = user.user_metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return user.email?.trim() ?? "";
}
