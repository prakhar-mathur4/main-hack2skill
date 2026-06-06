'use client';

import { useEffect, useState } from 'react';

const LOCAL_STORAGE_KEY = 'wellness_tracker_anon_id';

export function useAnonymousUser() {
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      let storedId = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!storedId) {
        // Generate a new UUID
        storedId = crypto.randomUUID();
        localStorage.setItem(LOCAL_STORAGE_KEY, storedId);
      }
      setUserId(storedId);
    } catch (e) {
      console.error('Error accessing localStorage for anonymous user id', e);
      // Fallback to in-memory random UUID for the session if localStorage fails
      setUserId(crypto.randomUUID());
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreSession = (newId: string): boolean => {
    // Simple UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(newId.trim())) {
      return false;
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newId.trim());
      setUserId(newId.trim());
      return true;
    } catch (e) {
      console.error('Error writing localStorage during session restore', e);
      return false;
    }
  };

  const resetSession = (): string => {
    const newId = crypto.randomUUID();
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newId);
      setUserId(newId);
    } catch (e) {
      console.error('Error resetting session in localStorage', e);
    }
    return newId;
  };

  return {
    userId,
    loading,
    restoreSession,
    resetSession,
  };
}
