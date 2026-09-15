import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type TimerContextType = {
  secondsToday: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const STORAGE_KEY = 'study:seconds';
const STORAGE_DATE_KEY = 'study:date';
const SYNC_INTERVAL_MS = 60_000;

const apiUrl = (path: string) => `${import.meta.env.VITE_API_URL ?? ''}${path}`;

export const StudyTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [secondsToday, setSecondsToday] = useState<number>(() => {
    try {
      const date = localStorage.getItem(STORAGE_DATE_KEY);
      const today = new Date().toISOString().slice(0, 10);
      if (date !== today) {
        localStorage.setItem(STORAGE_DATE_KEY, today);
        localStorage.setItem(STORAGE_KEY, '0');
        return 0;
      }
      return Number(localStorage.getItem(STORAGE_KEY) || '0');
    } catch {
      return 0;
    }
  });
  const [isRunning, setIsRunning] = useState(false);
  const tickRef = useRef<number | null>(null);
  const lastSyncedRef = useRef<number>(0);

  useEffect(() => {
    // ensure date rollover resets stored seconds
    const checkDate = () => {
      const storedDate = localStorage.getItem(STORAGE_DATE_KEY);
      const today = new Date().toISOString().slice(0, 10);
      if (storedDate !== today) {
        localStorage.setItem(STORAGE_DATE_KEY, today);
        localStorage.setItem(STORAGE_KEY, '0');
        setSecondsToday(0);
        lastSyncedRef.current = 0;
      }
    };
    const id = window.setInterval(checkDate, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(secondsToday));
  }, [secondsToday]);

  const sendMinutes = async (minutes: number) => {
    if (!minutes) return;
    try {
      const date = new Date().toISOString().slice(0, 10);
      const res = await fetch(apiUrl('/api/session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, minutes })
      });
      if (res.ok) {
        try { window.dispatchEvent(new CustomEvent('study:added', { detail: { date, minutes } })); } catch {}
      }
    } catch {
      // silent
    }
  };

  const start = () => {
    if (isRunning) return;
    setIsRunning(true);
    tickRef.current = window.setInterval(() => {
      setSecondsToday(s => s + 1);
    }, 1000);

    // periodic sync of full minutes since last sync
    const syncId = window.setInterval(() => {
      const now = Number(localStorage.getItem(STORAGE_KEY) || '0');
      const delta = now - lastSyncedRef.current;
      const minutes = Math.floor(delta / 60);
      if (minutes > 0) {
        void sendMinutes(minutes);
        lastSyncedRef.current += minutes * 60;
        localStorage.setItem(STORAGE_KEY, String(now));
      }
    }, SYNC_INTERVAL_MS);
    // store sync id on ref to clear later
    (tickRef as any).syncId = syncId;
  };

  const stop = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if ((tickRef as any).syncId) {
      window.clearInterval((tickRef as any).syncId);
      (tickRef as any).syncId = null;
    }
    setIsRunning(false);

    // final sync of remaining minutes using sendBeacon if available
    try {
      const now = Number(localStorage.getItem(STORAGE_KEY) || String(secondsToday));
      const delta = now - lastSyncedRef.current;
      const minutes = Math.floor(delta / 60);
      if (minutes > 0) {
        const url = apiUrl('/api/session');
        const payload = JSON.stringify({ date: new Date().toISOString().slice(0, 10), minutes });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
          try { window.dispatchEvent(new CustomEvent('study:added', { detail: { date: new Date().toISOString().slice(0,10), minutes } })); } catch {}
        } else {
          void sendMinutes(minutes);
        }
        lastSyncedRef.current += minutes * 60;
      }
    } catch {
      // ignore
    }
  };

  // ensure we attempt a final stop/sync on unload
  useEffect(() => {
    const beforeUnload = () => {
      stop();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  return <TimerContext.Provider value={{ secondsToday, isRunning, start, stop }}>{children}</TimerContext.Provider>;
};

export const useStudyTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useStudyTimer must be used inside StudyTimerProvider');
  return ctx;
};

export default StudyTimerProvider;
