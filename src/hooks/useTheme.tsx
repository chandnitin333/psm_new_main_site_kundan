import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Read from localStorage, default to 'dark' if not set (default theme = dark before login)
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove both classes first
    root.classList.remove('light', 'dark');
    // Add current theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      const label = next === 'dark' ? 'डार्क (Dark)' : 'लाइट (Light)';
      // lazy import to avoid circular deps at module load
      import('../utils/tracker').then(({ trackAction }) =>
        trackAction(`थीम बदलली — ${label} मोड`, { theme: next, page: window.location.pathname })
      );
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
