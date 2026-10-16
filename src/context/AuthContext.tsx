"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user?: User | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  signInAsGuest: (email?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signIn: async () => ({ error: new Error("Auth not initialized") }),
  signUp: async () => ({ error: new Error("Auth not initialized") }),
  resendConfirmation: async () => ({ error: new Error("Auth not initialized") }),
  signInAsGuest: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = useMemo(
    () => isSupabaseConfigured() && Boolean(getBrowserSupabaseClient()),
    []
  );
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if there is an active local/guest session
    if (typeof window !== "undefined") {
      const savedGuest = localStorage.getItem("flowboard_guest_user");
      if (savedGuest) {
        try {
          const parsed = JSON.parse(savedGuest);
          setUser(parsed);
          setLoading(false);
          return;
        } catch {
          // ignore corrupted data
        }
      }
    }

    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const signIn = async (email: string, password: string) => {
    if (!configured) {
      return {
        error: new Error(
          "Supabase Auth is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        ),
      };
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      return { error: new Error("Supabase client unavailable") };
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    setUser(data.user);
    setSession(data.session);
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    if (!configured) {
      return {
        error: new Error(
          "Supabase Auth is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        ),
      };
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      return { error: new Error("Supabase client unavailable") };
    }

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard`
        : undefined;

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return { error };
    }

    setUser(data.user);
    setSession(data.session);
    return { error: null, user: data.user };
  };

  const resendConfirmation = async (email: string) => {
    if (!configured) {
      return {
        error: new Error(
          "Supabase Auth is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        ),
      };
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      return { error: new Error("Supabase client unavailable") };
    }

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard`
        : undefined;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signInAsGuest = (email?: string) => {
    const targetEmail = email?.trim() || "architect@flowboard.dev";
    const guestUser = {
      id: "guest-user",
      email: targetEmail,
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
      app_metadata: { provider: "local" },
      user_metadata: { name: targetEmail.split("@")[0] },
    } as unknown as User;

    setUser(guestUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("flowboard_guest_user", JSON.stringify(guestUser));
    }
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("flowboard_guest_user");
    }

    if (!configured) {
      setUser(null);
      setSession(null);
      return;
    }

    const supabase = getBrowserSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: configured,
        signIn,
        signUp,
        resendConfirmation,
        signInAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
