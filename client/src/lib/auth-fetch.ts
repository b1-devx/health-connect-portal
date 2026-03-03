import { supabase } from "@/lib/supabase";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token ?? null;
  } catch {
    // Supabase not configured or session unavailable — proceed unauthenticated
  }
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}
