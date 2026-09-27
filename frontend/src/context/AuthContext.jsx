import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const AuthCtx = createContext(undefined);

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Keep one client for the provider lifetime. Recreating it on each render
  // makes data-loading effects treat it as a new dependency and discard
  // in-flight responses (including the village list).
  const api = useMemo(() => {
    const client = axios.create({ baseURL: BACKEND_URL });
    client.interceptors.request.use((config) => {
      const t = localStorage.getItem("token");
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
    return client;
  }, []);

  const loadUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    // We don't have a /me endpoint, so we decode the JWT to restore session
    const decoded = decodeJwt(token);
    if (decoded && decoded.sub) {
      setUser({ id: decoded.sub });
    } else {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/login`, { email, password });
      if (res.data.access_token) {
        setToken(res.data.access_token);
        setUser({ id: res.data.user_id });
        localStorage.setItem("token", res.data.access_token);
        return { success: true };
      }
      return { success: false, message: "Invalid response from server" };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || "Login failed" };
    }
  };

  const register = async (email, mobile_number, password, confirm_password, state, district) => {
    try {
      const payload = { email, mobile_number, password, confirm_password, state, district };
      const res = await axios.post(`${BACKEND_URL}/auth/signup`, payload);
      if (res.data.access_token) {
        setToken(res.data.access_token);
        setUser({ id: res.data.user_id });
        localStorage.setItem("token", res.data.access_token);
        return { success: true };
      }
      return { success: false, message: "Invalid response from server" };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || "Registration failed" };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const value = { user, token, loading, api, login, register, logout };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const context = useContext(AuthCtx);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
