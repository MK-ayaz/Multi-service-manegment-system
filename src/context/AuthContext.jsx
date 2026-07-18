import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .listTenants()
      .then(setTenants)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (creds) => {
    const s = await authService.login(creds);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const switchTenant = useCallback(async (tenantId) => {
    const s = await authService.switchTenant(tenantId);
    setSession(s);
    return s;
  }, []);

  const value = {
    session,
    user: session?.user,
    tenantId: session?.tenantId,
    tenant: tenants.find((t) => t.id === session?.tenantId),
    tenants,
    loading,
    login,
    logout,
    switchTenant,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
