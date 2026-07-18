import React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Login from './pages/Login/Login';
import AppShell from './components/AppShell/AppShell';
import Dashboard from './pages/Dashboard/Dashboard';
import Stores from './pages/Stores/Stores';
import Inventory from './pages/Inventory/Inventory';
import Sales from './pages/Sales/Sales';
import Customers from './pages/Customers/Customers';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <AppShell>
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
            </AppShell>
          </Protected>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        {(theme) => (
          <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
              <AppRoutes />
            </Router>
          </MuiThemeProvider>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}
