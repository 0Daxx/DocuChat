import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { initializeSystemKeys } from "@/lib/storage";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: UserProfile = {
  id: "demo-user-001",
  email: "demo@docuchat.ai",
  full_name: "Demo User",
};

const STORAGE_KEY = "docuchat_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isDemoMode = !isSupabaseConfigured();

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - load from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLoading(false);
      return;
    }

    // Supabase mode - check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await loadUserProfile(session.user.id);
          // Initialize system API keys for new users
          await initializeSystemKeys(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setUser({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
      });
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true);

    if (isDemoMode) {
      // Demo mode authentication
      await new Promise(resolve => setTimeout(resolve, 800));

      if (email === "demo@docuchat.ai" && password === "demo1234") {
        setUser(DEMO_USER);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
        setLoading(false);
        return {};
      }

      if (email.includes("@") && password.length >= 6) {
        const demoUser: UserProfile = {
          id: `user-${Date.now()}`,
          email,
          full_name: email.split("@")[0],
        };
        setUser(demoUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
        setLoading(false);
        return {};
      }

      setLoading(false);
      return { error: "Invalid credentials. Use demo@docuchat.ai / demo1234 or any valid email with 6+ char password." };
    }

    // Supabase authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
      }

      setLoading(false);
      return {};
    } catch (error) {
      setLoading(false);
      return { error: "Failed to sign in. Please try again." };
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    setLoading(true);

    if (isDemoMode) {
      // Demo mode sign up
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!email.includes("@")) {
        setLoading(false);
        return { error: "Please enter a valid email address." };
      }
      if (password.length < 6) {
        setLoading(false);
        return { error: "Password must be at least 6 characters." };
      }
      if (!fullName.trim()) {
        setLoading(false);
        return { error: "Please enter your name." };
      }

      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        email,
        full_name: fullName.trim(),
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setLoading(false);
      return {};
    }

    // Supabase sign up
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        // Initialize system API keys for new users
        await initializeSystemKeys(data.user.id);
      }

      setLoading(false);
      return {};
    } catch (error) {
      setLoading(false);
      return { error: "Failed to create account. Please try again." };
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error?: string }> => {
    if (!user) return { error: "Not authenticated" };

    if (isDemoMode) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      return {};
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setUser({ ...user, ...updates });
      return {};
    } catch (error) {
      return { error: "Failed to update profile" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
