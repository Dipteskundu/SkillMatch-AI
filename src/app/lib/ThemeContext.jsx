"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setTheme } from "../store/uiSlice";

const ThemeContext = createContext(undefined);

// Legacy key kept for backwards compatibility with pre-Redux installs.
const THEME_STORAGE_KEY = "skillmatch-theme";

function applyThemeToDocument(newTheme) {
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove("light", "dark");

  // Add new theme class
  root.classList.add(newTheme);

  // Update data attribute for additional styling if needed
  root.setAttribute("data-theme", newTheme);

  // Force a repaint to ensure styles are applied
  root.style.colorScheme = newTheme;
}

/**
 * Thin compatibility shim: theme state now lives in the Redux `ui` slice
 * (persisted via redux-persist). Existing `useTheme()` consumers keep working
 * unchanged, and `mounted` still guards against hydration mismatches.
 */
export function ThemeProvider({ children }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Seed from the legacy localStorage key on first mount. redux-persist may
    // refine this right after with its own rehydrated value (both are kept in
    // sync by toggleTheme).
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      dispatch(setTheme(savedTheme));
    }
    setMounted(true);
  }, [dispatch]);

  // Apply theme whenever theme state changes (only after mount, so SSR HTML
  // and the first client render always agree).
  useEffect(() => {
    if (mounted) {
      applyThemeToDocument(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    dispatch(setTheme(newTheme));
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, [dispatch, theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      mounted,
    }),
    [theme, toggleTheme, mounted],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
