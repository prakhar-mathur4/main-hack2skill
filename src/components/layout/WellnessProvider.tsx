'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';

interface WellnessContextType {
  userId: string;
  userLoading: boolean;
  isResultSeasonMode: boolean;
  toggleResultSeasonMode: () => void;
  restoreSession: (id: string) => boolean;
  resetSession: () => string;
  geminiKey: string;
  setGeminiKey: (key: string) => void;
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  const { userId, loading: userLoading, restoreSession, resetSession } = useAnonymousUser();
  const [isResultSeasonMode, setIsResultSeasonMode] = useState<boolean>(false);
  const [geminiKey, setGeminiKeyInternal] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Load result season
      const stored = localStorage.getItem('wellness_tracker_result_season');
      if (stored === 'true') {
        setIsResultSeasonMode(true);
        document.documentElement.classList.add('result-season-active');
      }

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

  const toggleResultSeasonMode = () => {
    setIsResultSeasonMode((prev) => {
      const newVal = !prev;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('wellness_tracker_result_season', String(newVal));
          if (newVal) {
            document.documentElement.classList.add('result-season-active');
          } else {
            document.documentElement.classList.remove('result-season-active');
          }
        }
      } catch (e) {
        console.error('Failed to toggle result season settings in localStorage', e);
      }
      return newVal;
    });
  };

  return (
    <WellnessContext.Provider
      value={{
        userId,
        userLoading,
        isResultSeasonMode,
        toggleResultSeasonMode,
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
