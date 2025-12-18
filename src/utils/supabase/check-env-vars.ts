// This check can be removed
// it is just for tutorial purposes

import { config } from "@/lib/config";

export const hasEnvVars =
  !!config.supabase.url &&
  !!config.supabase.anonKey;
