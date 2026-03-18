import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/config";

export const createClient = () => {
  const supabaseUrl = getSupabaseUrl();

  // In the browser, proxy API requests through Vercel to bypass Indian ISP
  // DNS blocks on *.supabase.co. We pass the REAL Supabase URL to
  // createBrowserClient so cookie names match the server middleware,
  // then intercept fetch to route requests through /supabase-proxy.
  const isClient = typeof window !== 'undefined';
  const proxyBaseUrl = isClient
    ? `${window.location.origin}/supabase-proxy`
    : null;

  return createBrowserClient(
    supabaseUrl,
    getSupabaseAnonKey(),
    proxyBaseUrl
      ? {
          global: {
            fetch: (url: RequestInfo | URL, init?: RequestInit) => {
              const urlStr = url.toString();
              const proxiedUrl = urlStr.replace(supabaseUrl, proxyBaseUrl);
              return fetch(proxiedUrl, init);
            },
          },
        }
      : undefined,
  );
};
