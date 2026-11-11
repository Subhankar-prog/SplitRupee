"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDarkMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

function applyDomTheme(next: Theme) {
  if (typeof document === "undefined") return;
  if (next === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("splitrupee_theme");
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
        applyDomTheme(saved);
      } else {
        const prefersDark =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-color-scheme: dark)").matches;
        const resolved: Theme = prefersDark ? "dark" : "light";
        setThemeState(resolved);
        applyDomTheme(resolved);
      }
    } catch {
      setThemeState("light");
      applyDomTheme("light");
    }

    // Listen for system color-scheme changes if user has not set an explicit preference
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemChange = (e: MediaQueryListEvent) => {
        try {
          const explicit = localStorage.getItem("splitrupee_theme");
          if (explicit !== "light" && explicit !== "dark") {
            const next: Theme = e.matches ? "dark" : "light";
            setThemeState(next);
            applyDomTheme(next);
          }
        } catch {}
      };
      mq.addEventListener?.("change", handleSystemChange);
      return () => mq.removeEventListener?.("change", handleSystemChange);
    }
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem("splitrupee_theme", next);
      applyDomTheme(next);
      window.dispatchEvent(new CustomEvent("splitrupee_theme_changed", { detail: { theme: next } }));
    } catch (e) {
      console.warn("Failed to set theme in localStorage", e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
