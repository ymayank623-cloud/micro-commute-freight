import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Read saved theme from localStorage (defaults to "dark")
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem("app_theme");
    return saved === "light" ? "light" : "dark";
  });

  // Progress value: 0 = Dark, 1 = Light
  const [p, setPState] = useState(() => {
    const saved = localStorage.getItem("app_theme");
    return saved === "light" ? 1 : 0;
  });

  // Synchronize with DOM attributes and variables
  const applyThemeToDOM = useCallback((currentTheme, currentP) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", currentTheme);
    root.style.setProperty("--p", String(currentP));
    
    // Also apply to body for fallback matching
    document.body.setAttribute("data-theme", currentTheme);
  }, []);

  // Update theme function
  const setTheme = useCallback((newTheme) => {
    const targetTheme = newTheme === "light" ? "light" : "dark";
    const targetP = targetTheme === "light" ? 1 : 0;
    
    setThemeState(targetTheme);
    setPState(targetP);
    localStorage.setItem("app_theme", targetTheme);
    applyThemeToDOM(targetTheme, targetP);
  }, [applyThemeToDOM]);

  // Set continuous interpolation progress (0 to 1) for live dragging
  const setP = useCallback((newP, commit = false) => {
    const clamped = Math.max(0, Math.min(1, newP));
    setPState(clamped);
    
    const derivedTheme = clamped >= 0.5 ? "light" : "dark";
    if (derivedTheme !== theme) {
      setThemeState(derivedTheme);
    }
    
    applyThemeToDOM(derivedTheme, clamped);
    
    if (commit) {
      localStorage.setItem("app_theme", derivedTheme);
    }
  }, [theme, applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Initial setup on mount
  useEffect(() => {
    const initialTheme = localStorage.getItem("app_theme") === "light" ? "light" : "dark";
    const initialP = initialTheme === "light" ? 1 : 0;
    setThemeState(initialTheme);
    setPState(initialP);
    applyThemeToDOM(initialTheme, initialP);
  }, [applyThemeToDOM]);

  return (
    <ThemeContext.Provider value={{ theme, p, setTheme, setP, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
