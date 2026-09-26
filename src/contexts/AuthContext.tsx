import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: "demo-user-001",
  email: "demo@docuchat.ai",
  name: "Demo User",
  createdAt: Date.now(),
};

const STORAGE_KEY = "docuchat_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we're in demo mode (no real backend configured)
  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    // Load user from localStorage
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
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isDemoMode) {
      // Demo mode: accept demo credentials or any valid-looking credentials
      if (email === "demo@docuchat.ai" && password === "demo1234") {
        setUser(DEMO_USER);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
        setLoading(false);
        return {};
      }

      // Accept any valid email/password in demo mode
      if (email.includes("@") && password.length >= 6) {
        const demoUser: User = {
          id: `user-${Date.now()}`,
          email,
          name: email.split("@")[0],
          createdAt: Date.now(),
        };
        setUser(demoUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
        setLoading(false);
        return {};
      }

      setLoading(false);
      return { error: "Invalid credentials. Use demo@docuchat.ai / demo1234 or any valid email with 6+ char password." };
    }

    // Future: Real Supabase auth
    setLoading(false);
    return { error: "Authentication not configured. Please set up Supabase." };
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isDemoMode) {
      // Demo mode: create a mock user
      if (!email.includes("@")) {
        setLoading(false);
        return { error: "Please enter a valid email address." };
      }
      if (password.length < 6) {
        setLoading(false);
        return { error: "Password must be at least 6 characters." };
      }
      if (!name.trim()) {
        setLoading(false);
        return { error: "Please enter your name." };
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        name: name.trim(),
        createdAt: Date.now(),
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setLoading(false);
      return {};
    }

    // Future: Real Supabase auth
    setLoading(false);
    return { error: "Authentication not configured. Please set up Supabase." };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, signIn, signUp, signOut }}>
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
