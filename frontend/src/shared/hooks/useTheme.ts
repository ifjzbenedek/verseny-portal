import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'system';

const STORAGE_KEY = 'theme';

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  const effective = mode === 'system' ? getSystemPreference() : mode;
  document.documentElement.dataset.theme = effective;
  document.documentElement.classList.toggle('dark', effective === 'dark');
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system';
  });

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((prev) => {
      const order: ThemeMode[] = ['light', 'dark', 'high-contrast', 'system'];
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  }, []);

  return { mode, setMode, cycle };
}
