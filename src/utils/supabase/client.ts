import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/config";

export const createClient = () => {
  // Use proxy URL in browser to bypass Indian ISP DNS blocks on *.supabase.co
  // Server-side (SSR) falls back to the direct Supabase URL (unaffected)
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/supabase-proxy`
    : getSupabaseUrl();

  return createBrowserClient(
    baseUrl,
    getSupabaseAnonKey(),
  );
};
