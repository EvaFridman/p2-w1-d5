"use client";

import type { ReactNode } from "react";
import { useEffect, useSyncExternalStore } from "react";

import styles from "./ThemeSwitcher.module.css";

type Theme = "light" | "dark" | "system";

type Props = {
  variant: "header" | "footer";
};

const themes: { id: Theme; title: string }[] = [
  { id: "light", title: "Светлая" },
  { id: "dark", title: "Тёмная" },
  { id: "system", title: "Системная" },
];

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getSavedTheme(): Theme {
  const savedTheme = localStorage.getItem("theme");
  return savedTheme === "light" || savedTheme === "dark" || savedTheme === "system"
    ? savedTheme
    : "system";
}

const themeStore = {
  listeners: new Set<() => void>(),

  subscribe(listener: () => void) {
    themeStore.listeners.add(listener);
    window.addEventListener("storage", listener);

    return () => {
      themeStore.listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },

  getSnapshot() {
    return getSavedTheme();
  },

  getServerSnapshot() {
    return "system" as Theme;
  },

  setTheme(theme: Theme) {
    localStorage.setItem("theme", theme);
    themeStore.listeners.forEach((listener) => listener());
  },
};

function applyTheme(theme: Theme) {
  const actualTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(actualTheme);
}

export function ThemeSwitcher({ variant }: Props): ReactNode {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  useEffect(() => {
    applyTheme(theme);

    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      applyTheme("system");
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  function handleThemeChange(nextTheme: Theme) {
    themeStore.setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div className={styles[variant]}>
      {variant === "footer" && <span className={styles.label}>Тема</span>}
      <div className={styles.buttons}>
        {themes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={theme === item.id ? styles.active : styles.button}
            onClick={() => handleThemeChange(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
