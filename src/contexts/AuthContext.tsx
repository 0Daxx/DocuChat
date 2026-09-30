import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { initializeSystemKeys } from "@/lib/storage";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_demo?: boolean;
}

export type AuthState = 
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: UserProfile };

interface AuthContextType {
  authState: AuthState;
  user: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  isSupabaseAvailable: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signInAsDemo: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_EMAIL = "demo@docuchat.ai";
const DEMO_PASSWORD = "demo1234";
const DEMO_FULL_NAME = "Demo User";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const isSupabaseAvailable = isSupabaseConfigured();

  // Derive convenience properties from authState
  const user = authState.status === "authenticated" ? authState.user : null;
  const loading = authState.status === "loading";
  const isDemoUser = authState.status === "authenticated" && authState.user.is_demo === true;

  useEffect(() => {
    if (!isSupabaseAvailable) {
      // Supabase not configured - user must sign in via demo button
      setAuthState({ status: "unauthenticated" });
      return;
    }

    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setAuthState({ status: "unauthenticated" });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await loadUserProfile(session.user.id);
          await initializeSystemKeys(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setAuthState({ status: "unauthenticated" });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      const profile: UserProfile = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        is_demo: data.is_demo || false,
      };

      setAuthState({ status: "authenticated", user: profile });
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setAuthState({ status: "unauthenticated" });
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseAvailable) {
      return { error: "Supabase is not configured. Please use the Demo button." };
    }

    setAuthState({ status: "loading" });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState({ status: "unauthenticated" });
        return { error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
      }

      return {};
    } catch (error) {
      setAuthState({ status: "unauthenticated" });
      return { error: "Failed to sign in. Please try again." };
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    if (!isSupabaseAvailable) {
      return { error: "Supabase is not configured. Please use the Demo button." };
    }

    setAuthState({ status: "loading" });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            is_demo: false,
          },
        },
      });

      if (error) {
        setAuthState({ status: "unauthenticated" });
        return { error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        await initializeSystemKeys(data.user.id);
      }

      return {};
    } catch (error) {
      setAuthState({ status: "unauthenticated" });
      return { error: "Failed to create account. Please try again." };
    }
  };

  const signInAsDemo = async (): Promise<{ error?: string }> => {
    setAuthState({ status: "loading" });

    if (!isSupabaseAvailable) {
      // Supabase not configured - create a local demo session
      const demoUser: UserProfile = {
        id: "demo-local-" + Date.now(),
        email: DEMO_EMAIL,
        full_name: DEMO_FULL_NAME,
        is_demo: true,
      };
      
      // Store demo session in localStorage for persistence
      localStorage.setItem("docuchat_demo_session", JSON.stringify(demoUser));
      setAuthState({ status: "authenticated", user: demoUser });
      return {};
    }

    // Supabase is configured - sign in as demo user via Supabase
    try {
      // First, try to sign in with demo credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (signInError) {
        // Demo account doesn't exist - create it
        if (signInError.message.includes("Invalid login credentials") || 
            signInError.message.includes("Email not confirmed")) {
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            options: {
              data: {
                full_name: DEMO_FULL_NAME,
                is_demo: true,
              },
            },
          });

          if (signUpError) {
            setAuthState({ status: "unauthenticated" });
            return { error: `Failed to create demo account: ${signUpError.message}` };
          }

          if (signUpData.user) {
            // Mark the profile as demo
            await supabase
              .from("profiles")
              .update({ is_demo: true })
              .eq("id", signUpData.user.id);

            await loadUserProfile(signUpData.user.id);
            await initializeSystemKeys(signUpData.user.id);
          }
        } else {
          setAuthState({ status: "unauthenticated" });
          return { error: signInError.message };
        }
      } else if (signInData.user) {
        // Successfully signed in - verify it's marked as demo
        await loadUserProfile(signInData.user.id);
        
        // Ensure the profile is marked as demo
        if (!user?.is_demo) {
          await supabase
            .from("profiles")
            .update({ is_demo: true })
            .eq("id", signInData.user.id);
        }
        
        await initializeSystemKeys(signInData.user.id);
      }

      return {};
    } catch (error) {
      setAuthState({ status: "unauthenticated" });
      return { error: "Failed to sign in as demo user. Please try again." };
    }
  };

  const signOut = async () => {
    // Clear local demo session if exists
    localStorage.removeItem("docuchat_demo_session");

    if (!isSupabaseAvailable) {
      setAuthState({ status: "unauthenticated" });
      return;
    }

    try {
      await supabase.auth.signOut();
      setAuthState({ status: "unauthenticated" });
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error?: string }> => {
    if (!user) return { error: "Not authenticated" };

    if (user.is_demo && !isSupabaseAvailable) {
      // Local demo session - update in localStorage
      const updatedUser = { ...user, ...updates };
      localStorage.setItem("docuchat_demo_session", JSON.stringify(updatedUser));
      setAuthState({ status: "authenticated", user: updatedUser });
      return {};
    }

    if (!isSupabaseAvailable) {
      return { error: "Supabase is not configured" };
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setAuthState({ status: "authenticated", user: { ...user, ...updates } });
      return {};
    } catch (error) {
      return { error: "Failed to update profile" };
    }
  };

  return (
    <AuthContext.Provider value={{
      authState,
      user,
      loading,
      isDemoUser,
      isSupabaseAvailable,
      signIn,
      signUp,
      signInAsDemo,
      signOut,
      updateProfile,
    }}>
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
