'use client';

import { createContext, useContext, useState } from 'react';

type AuthContextType = {
  openAuth: () => void;
  closeAuth: () => void;
  isOpen: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAuth = () => setIsOpen(true);
  const closeAuth = () => setIsOpen(false);

  return (
    <AuthContext.Provider value={{ openAuth, closeAuth, isOpen }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}