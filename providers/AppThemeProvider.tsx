import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { getTheme, lightTheme, type AppTheme, type ThemeMode } from "@/constants/theme";
import {
  getSettings,
  setThemeMode as persistThemeMode,
  subscribeSettings,
} from "@/utils/settingsManager";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  isDark: boolean;
  setThemeMode: (next: ThemeMode) => Promise<void>;
  toggleThemeMode: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  theme: lightTheme,
  isDark: false,
  setThemeMode: async () => undefined,
  toggleThemeMode: async () => undefined,
});

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((settings) => {
        if (isMounted) {
          setMode(settings.themeMode);
        }
      })
      .catch((error) => {
        console.error("Failed to load theme settings:", error);
      });

    const unsubscribe = subscribeSettings((next) => {
      if (isMounted) {
        setMode(next.themeMode);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const setThemeMode = async (next: ThemeMode) => {
    await persistThemeMode(next);
  };

  const toggleThemeMode = async () => {
    await persistThemeMode(mode === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: getTheme(mode),
        isDark: mode === "dark",
        setThemeMode,
        toggleThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
