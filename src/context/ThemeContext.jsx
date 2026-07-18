import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createTheme } from '@mui/material/styles';
import { settingsService } from '../services/api';

const ThemeContext = createContext(null);
export function useThemeMode() {
  return useContext(ThemeContext);
}

function buildTheme(mode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
      background: dark ? { default: '#121212', paper: '#1e1e1e' } : { default: '#f5f5f5', paper: '#ffffff' },
    },
    shape: { borderRadius: 10 },
  });
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    settingsService.get().then((s) => {
      if (s?.darkMode) setMode('dark');
    }).catch(() => {});
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const toggleTheme = async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try {
      await settingsService.save({ darkMode: next === 'dark' });
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children(theme)}
    </ThemeContext.Provider>
  );
}
