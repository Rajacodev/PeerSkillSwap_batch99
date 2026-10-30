import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import authService from "../services/authService";
import userService from "../services/userService";
import { TOKEN_STORAGE_KEY, REFRESH_STORAGE_KEY } from "../utils/constants";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await userService.getMe();
      setUser(data.data);
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, data.data.access_token);
    localStorage.setItem(REFRESH_STORAGE_KEY, data.data.refresh_token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authService.register(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.data.access_token);
    localStorage.setItem(REFRESH_STORAGE_KEY, data.data.refresh_token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout — clear local state regardless
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await userService.getMe();
    setUser(data.data);
    return data.data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, loading, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
