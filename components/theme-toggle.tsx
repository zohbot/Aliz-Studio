"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type ThemeName = "light" | "night";

const themeStorageKey = "aliz-theme";
const themeChangeEvent = "aliz-theme-change";

function isThemeName(value: string | null): value is ThemeName {
  return value === "light" || value === "night";
}

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "night" ? "dark" : "light";
}

function getThemeSnapshot(): ThemeName {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);

  if (isThemeName(storedTheme)) {
    return storedTheme;
  }

  return document.documentElement.dataset.theme === "night" ? "night" : "light";
}

function subscribeToThemeChanges(callback: () => void) {
  window.addEventListener(themeChangeEvent, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(themeChangeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToThemeChanges, getThemeSnapshot, () => "light");

  function toggleTheme() {
    const nextTheme: ThemeName = theme === "night" ? "light" : "night";

    applyTheme(nextTheme);
    window.localStorage.setItem(themeStorageKey, nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  const isNightTheme = theme === "night";

  return (
    <button
      aria-label={isNightTheme ? "Switch to light theme" : "Switch to night theme"}
      aria-pressed={isNightTheme}
      className="theme-toggle"
      onClick={toggleTheme}
      title={isNightTheme ? "Switch to light theme" : "Switch to night theme"}
      type="button"
    >
      {isNightTheme ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isNightTheme ? "Night" : "Light"}</span>
    </button>
  );
}
