import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co") as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key") as string;

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn("[WellA] VITE_SUPABASE_URL not set. Set up Supabase credentials to enable authentication.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;
