import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
}

interface AuthContextType {
  user: User | null;
  isDemoUser: boolean;
  isSupabaseAvailable: boolean;
  signInAsDemo: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@docuchat.ai',
  name: 'Demo User',
  isDemo: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in (demo mode)
    const storedUser = localStorage.getItem('docuchat_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signInAsDemo = async () => {
    setUser(DEMO_USER);
    localStorage.setItem('docuchat_user', JSON.stringify(DEMO_USER));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('docuchat_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isDemoUser: user?.isDemo ?? false,
        isSupabaseAvailable: false, // Demo-only mode
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
