import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/config";

export const createClient = () => {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
  );
};
