import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_THEME_ID, THEME_PRESETS, type ThemePreset, type ThemePresetId } from '../data/themes.ts';

const THEME_STORAGE_KEY = 'unstuck.theme.v1';

type ThemeContextValue = {
  themeId: ThemePresetId;
  theme: ThemePreset;
  themes: ThemePreset[];
  setTheme: (themeId: ThemePresetId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemePresetId = (value: string): value is ThemePresetId =>
  THEME_PRESETS.some((preset) => preset.id === value);

const readPersistedTheme = (): ThemePresetId => {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_ID;
    const parsed = JSON.parse(raw) as { themeId?: string } | null;
    if (!parsed?.themeId) return DEFAULT_THEME_ID;
    return isThemePresetId(parsed.themeId) ? parsed.themeId : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemePresetId>(() => readPersistedTheme());

  const setTheme = useCallback((nextThemeId: ThemePresetId) => {
    setThemeId(nextThemeId);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.theme = themeId;
  }, [themeId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ themeId }));
  }, [themeId]);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = THEME_PRESETS.find((preset) => preset.id === themeId) ?? THEME_PRESETS[0];
    return {
      themeId,
      theme,
      themes: THEME_PRESETS,
      setTheme,
    };
  }, [themeId, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
};
