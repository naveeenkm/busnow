import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken: string | null = null;
let onLogout: (() => void) | null = null;
let refreshPromise: Promise<string> | null = null;

export const setAccessToken = (t: string | null) => { accessToken = t; };
export const registerLogoutHandler = (fn: () => void) => { onLogout = fn; };

// ── attach accessToken to every request ─────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// ── on 401: use refreshToken cookie → get new accessToken → retry ───
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthCall = original?.url?.includes("/auth/");

    if (err.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        // deduplicate: if multiple requests fail at once, share one refresh call
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
            .then(({ data }) => data.accessToken)
            .finally(() => { refreshPromise = null; });
        }
        accessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        // refreshToken also gone/expired → force logout
        accessToken = null;
        onLogout?.();
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export const apiError = (e: unknown, fallback = "Something went wrong") => {
  if (axios.isAxiosError(e)) return e.response?.data?.message || e.message || fallback;
  return fallback;
};
