import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api, setAccessToken, registerLogoutHandler } from "@/lib/api";
import type { User } from "@/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  pendingRequests: number;
  refreshPending: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
    setPendingRequests(0);
  }, []);

  useEffect(() => { registerLogoutHandler(logout); }, [logout]);

  const fetchPending = useCallback(async (role: string) => {
    if (role !== "admin") return;
    try {
      const { data } = await api.get("/route-requests");
      const count = (data.requests || []).filter((r: { status: string }) => r.status === "pending").length;
      setPendingRequests(count);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    api.post("/auth/refresh")
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        setUser(data.user);
        fetchPending(data.user?.role);
      })
      .catch(() => { setAccessToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    fetchPending(data.user?.role);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.post("/auth/refresh");
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch { /* ignore */ }
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, pendingRequests, refreshPending: () => fetchPending(user?.role || ""), refreshUser, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
