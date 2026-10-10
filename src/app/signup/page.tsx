"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Lock, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form validation
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid work email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!isConfigured) {
      setError(
        "Supabase credentials are not configured in your environment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live user accounts. You can also explore Flowboard immediately via the demo sandbox."
      );
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError, user } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(
          "Account created successfully! Check your email for a confirmation link, or proceed to your dashboard."
        );
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Background glow effects */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-ai/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-60 pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 border border-primary/30 transition-transform group-hover:scale-105">
            <span className="text-base font-black">F</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Flowboard</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Start visually designing, reviewing, and applying software system architectures.
        </p>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4"
      >
        <div className="bg-card border border-border shadow-xl rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
          {!isConfigured && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-500 flex items-start gap-2.5">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Supabase Auth Not Configured</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Environment variables <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">NEXT_PUBLIC_SUPABASE_URL</code> are unset. Real authentication is disabled.
                </p>
                <div className="pt-1">
                  <Link
                    href="/demo"
                    className="inline-flex items-center gap-1.5 font-semibold text-ai hover:underline text-xs"
                  >
                    <span>Launch Live Demo Without Account</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-500 flex items-start gap-2.5"
            >
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">{success}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@company.com"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Registering account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          {/* Alternative Demo Link */}
          <div className="mt-6 pt-5 border-t border-border flex flex-col gap-3 text-center text-xs">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-foreground hover:text-ai underline-offset-4 hover:underline transition-colors">
                Sign in
              </Link>
            </p>
            <div className="pt-2">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-border bg-secondary/30 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
              >
                <Sparkles size={13} className="text-ai" />
                <span>Explore Interactive Demo Sandbox</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
