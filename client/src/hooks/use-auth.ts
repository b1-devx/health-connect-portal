import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AppUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

async function syncAndFetchUser(supabaseUser: SupabaseUser, token: string): Promise<AppUser | null> {
  const meta = supabaseUser.user_metadata || {};
  try {
    await fetch("/api/auth/sync-user", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: supabaseUser.email,
        firstName: meta.firstName || meta.first_name || null,
        lastName: meta.lastName || meta.last_name || null,
        profileImageUrl: meta.avatarUrl || null,
      }),
    });
    const res = await fetch("/api/auth/user", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error("Error syncing user:", err);
  }
  return { id: supabaseUser.id, email: supabaseUser.email };
}

export function useAuth() {
  const [appUser, setAppUser] = useState<AppUser | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = await syncAndFetchUser(session.user, session.access_token);
        setAppUser(user);
      } else {
        setAppUser(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setAppUser(null);
        queryClient.clear();
        return;
      }
      if (session?.user) {
        const user = await syncAndFetchUser(session.user, session.access_token);
        setAppUser(user);
        queryClient.invalidateQueries();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); };

  return {
    user: appUser ?? null,
    isLoading: appUser === undefined,
    isAuthenticated: !!appUser,
    logout,
    isLoggingOut: false,
  };
}
