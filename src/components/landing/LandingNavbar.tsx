// LandingNavbar — Sleek top navigation bar for the Flowboard homepage.
// Features brand badge, navigation links, theme switcher, demo button, and auth CTAs.

"use client";

import Link from "next/link";
import { ArrowRight, Sun, Moon, Sparkles, LayoutDashboard } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuth } from "@/context/AuthContext";

export function LandingNavbar() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const { user } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 border-b border-border bg-background/85 backdrop-blur-xl transition-colors">
      <div className="container mx-auto px-4 md:px-8 h-full flex items-center justify-between max-w-6xl">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 border border-primary/30 transition-transform group-hover:scale-105">
            <span className="text-sm font-black tracking-tight">F</span>
          </div>
          <span className="text-base font-bold tracking-tight text-foreground group-hover:text-foreground transition-colors">
            Flowboard
          </span>
          <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[9px] font-semibold text-foreground border border-border">
            v1.0
          </span>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">
            Workflow
          </Link>
          <Link href="#showcase" className="hover:text-foreground transition-colors">
            Mutations
          </Link>
          <Link href="/demo" className="text-ai font-semibold hover:underline flex items-center gap-1 transition-colors">
            <Sparkles size={11} />
            <span>Interactive Demo</span>
          </Link>
        </nav>

        {/* CTA Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            title={`Switch to ${theme === "light" ? "Dark Mode (Midnight Navy)" : "Light Mode (Porcelain Ice)"}`}
          >
            {theme === "light" ? (
              <>
                <Sun size={13} className="text-amber-500" />
                <span className="text-[11px] hidden sm:inline">Ice</span>
              </>
            ) : (
              <>
                <Moon size={13} className="text-ai" />
                <span className="text-[11px] hidden sm:inline">Navy</span>
              </>
            )}
          </button>

          {/* User state link */}
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <LayoutDashboard size={13} className="text-ai" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/board"
            className="group relative flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-90 active:scale-98"
          >
            <span>Start Building</span>
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
