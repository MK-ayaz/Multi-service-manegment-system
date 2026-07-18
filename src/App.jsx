import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout/MainLayout';

import Dashboard from './pages/Dashboard/Dashboard';
import Stores from './pages/Stores/Stores';
import Inventory from './pages/Inventory/Inventory';
import Sales from './pages/Sales/Sales';
import Customers from './pages/Customers/Customers';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

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
      background: dark
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#f5f5f5', paper: '#ffffff' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: { body: { margin: 0, padding: 0, overflow: 'hidden' } },
      },
    },
  });
}

function App() {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.api?.settings?.get) {
      window.api.settings.get().then((s) => {
        if (s?.darkMode) setMode('dark');
      }).catch(() => {});
    }
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const toggleTheme = async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try {
      await window.api?.theme?.set(next);
      await window.api?.settings?.setSetting('darkMode', next === 'dark');
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </MainLayout>
        </Router>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;
