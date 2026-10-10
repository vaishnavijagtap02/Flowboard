"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center relative overflow-hidden transition-colors selection:bg-ai/25">
      <div className="relative z-10 max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center mx-auto mb-4 text-destructive">
          <AlertCircle size={22} />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Something went wrong
        </h2>

        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          An unexpected error occurred while rendering the interface. Your canvas data in session storage is preserved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Home size={13} />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
