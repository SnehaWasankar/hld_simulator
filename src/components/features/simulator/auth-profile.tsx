'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { getUserColor } from './utils/storage';

interface AuthProfileProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function AuthProfile({ open, setOpen }: AuthProfileProps) {
  const { user, openAuth, logout } = useAuth();
  const color = user ? getUserColor(user.email) : null;

  if (!user) {
    return (
      <Button
        onClick={openAuth}
        variant="outline"
        size="sm"
        className="bg-blue-500/20 text-blue-800 border border-blue-200 
        hover:bg-blue-500/10 hover:border-blue-400
        font-medium transition-all duration-200"
      >
        Login / Sign Up
      </Button>
    );
  }

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(!open)}
        className={`w-8 h-8 rounded-full 
        ${color?.bg} ${color?.text} border ${color?.border}
        ${color?.hover}
        flex items-center justify-center 
        cursor-pointer font-semibold 
        transition-all duration-200`}
      >
        {user.email[0].toUpperCase()}
      </div>

      {open && (
        <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-md">
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="inline-block px-3 py-1.5 text-red-700 
            bg-red-500/10 border border-red-200
            hover:bg-red-500/20 hover:border-red-400
            transition-all duration-200 text-sm
            rounded-md"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
