import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "../components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Convertr",
  description: "Online file convertr clone built with Next.js SaaS architecture."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
            <Link href="/" className="text-sm font-semibold tracking-wide">
              convertr
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Convert
              </Link>
              <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Dashboard
              </Link>
              <Link href="/billing" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Billing
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Login
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <div className="hidden text-xs text-muted-foreground md:block">Fast, clean file conversion</div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-8">
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
