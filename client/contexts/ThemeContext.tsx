import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { getThemePreference, saveThemePreference, type ThemePreference } from "@/lib/storage";

interface ThemeContextType {
  colorScheme: "light" | "dark";
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("dark");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    const preference = await getThemePreference();
    setThemePreferenceState(preference);
    setIsLoaded(true);
  };

  const setThemePreference = async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    await saveThemePreference(preference);
  };

  const colorScheme: "light" | "dark" = 
    themePreference === "system" 
      ? (systemColorScheme || "dark")
      : themePreference;

  const isDark = colorScheme === "dark";

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, themePreference, setThemePreference, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
