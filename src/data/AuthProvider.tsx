import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Role = 'admin' | 'suporte';

export type AdminUser = {
  name: string;
  email: string;
  role: Role;
};

type AuthValue = {
  user: AdminUser | null;
  canManage: boolean;
  signIn: (email: string, role: Role) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      canManage: user?.role === 'admin',
      signIn: (email, role) => {
        const local = email.split('@')[0] || 'admin';
        const name = local.split(/[._-]/)[0];
        setUser({ email, role, name: name.charAt(0).toUpperCase() + name.slice(1) });
      },
      signOut: () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
