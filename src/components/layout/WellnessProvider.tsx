'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';

interface WellnessContextType {
  userId: string;
  userLoading: boolean;
  restoreSession: (id: string) => boolean;
  resetSession: () => string;
  geminiKey: string;
  setGeminiKey: (key: string) => void;
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  const { userId, loading: userLoading, restoreSession, resetSession } = useAnonymousUser();
  const [geminiKey, setGeminiKeyInternal] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Load Gemini key
      const storedKey = localStorage.getItem('wellness_tracker_gemini_key');
      if (storedKey) {
        setGeminiKeyInternal(storedKey);
      }
    } catch (e) {
      console.error('Failed to read settings from localStorage', e);
    }
  }, []);

  const setGeminiKey = (newKey: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wellness_tracker_gemini_key', newKey.trim());
      }
      setGeminiKeyInternal(newKey.trim());
    } catch (e) {
      console.error('Failed to write gemini key to localStorage', e);
    }
  };

  return (
    <WellnessContext.Provider
      value={{
        userId,
        userLoading,
        restoreSession,
        resetSession,
        geminiKey,
        setGeminiKey,
      }}
    >
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const context = useContext(WellnessContext);
  if (context === undefined) {
    throw new Error('useWellness must be used within a WellnessProvider');
  }
  return context;
}
