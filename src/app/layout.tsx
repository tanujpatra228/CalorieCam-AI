import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Toaster } from '@/components/ui/toaster';
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { ThemeProvider } from "next-themes";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AnalysisProvider } from '@/contexts/analysis-context'
import { createClient } from '@/utils/supabase/server'
import { getAppUrl } from "@/lib/config";

const defaultUrl = getAppUrl();

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "CalorieCam AI",
  description: "Comprehensive macro breakdown from a single photo",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnalysisProvider isLoggedIn={!!user}>
            <main className="min-h-screen md:flex md:flex-col md:items-center">
              <div className="">
                <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                  <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                    <div className="flex gap-5 items-center font-semibold">
                      <Link href={"/"}>CalorieCam AI</Link>
                      {user && (
                        <>
                          <Link href="/protected/analysis-history" className="text-muted-foreground hover:text-foreground hidden md:block">
                            History
                          </Link>
                          <Link href="/protected/profile" className="text-muted-foreground hover:text-foreground hidden md:block">
                            Profile
                          </Link>
                        </>
                      )}
                    </div>
                    {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                  </div>
                </nav>
                <div className="p-2">
                  {children}
                </div>

                <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-4">
                  <p>Made with passion and technology</p>
                  <ThemeSwitcher />
                </footer>
              </div>
            </main>
            <Toaster />
          </AnalysisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
