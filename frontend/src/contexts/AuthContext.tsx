/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";

export type UserRole = "ADMIN" | "FUNCTIONAL" | "USER";

export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  role: UserRole;
  areaId?: string;
  state: "ACTIVE" | "INACTIVE" | "REMOVED";
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  startGoogleLogin: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

axios.defaults.withCredentials = true;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/auth/me`);
      setUser(response.data);
    } catch {
      setUser(null);
      throw new Error("No autenticado");
    }
  }, []);

  const startGoogleLogin = useCallback(() => {
    window.location.href = `${BACKEND_URL}/auth/google/start`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${BACKEND_URL}/auth/logout`);
    } finally {
      setUser(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      await axios.post(`${BACKEND_URL}/auth/refresh`);
      await fetchMe();
    } catch {
      setUser(null);
      throw new Error("La sesion expiro");
    }
  }, [fetchMe]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        await fetchMe();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchMe]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          originalRequest.url !== `${BACKEND_URL}/auth/refresh`
        ) {
          originalRequest._retry = true;
          try {
            await refreshSession();
            return axios(originalRequest);
          } catch (refreshError) {
            setUser(null);
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshSession]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    startGoogleLogin,
    logout,
    refreshSession,
    fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
