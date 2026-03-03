import { createClient } from "@supabase/supabase-js";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

const supabaseUrl = (typeof __SUPABASE_URL__ !== "undefined" ? __SUPABASE_URL__ : "") ||
  import.meta.env.VITE_SUPABASE_URL ||
  "https://placeholder.supabase.co";

const supabaseAnonKey = (typeof __SUPABASE_ANON_KEY__ !== "undefined" ? __SUPABASE_ANON_KEY__ : "") ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
  console.warn("[WellA] Supabase URL not configured. Set SUPABASE_URL in your environment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = supabaseUrl !== "https://placeholder.supabase.co" && !!supabaseAnonKey;
