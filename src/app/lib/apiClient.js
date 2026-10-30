import axios from "axios";

const cleanEnv = (value) =>
  typeof value === "string" ? value.trim() : value;

const rawBase = cleanEnv(process.env.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:5000";

// Strip trailing slash
export const API_BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

/**
 * In the browser we use a relative base URL so requests go through the
 * Next.js rewrite proxy → avoids CORS entirely.
 * On the server (SSR/RSC) we use the full backend URL directly.
 */
const baseURL =
  typeof window === "undefined"
    ? (typeof process !== "undefined" && process.env.VERCEL && !process.env.NEXT_PUBLIC_API_BASE_URL
        ? "http://SERVER_CONFIG_REQUIRED" // Fail fast with a clear error if misconfigured on Vercel
        : API_BASE)
    : "";               // client-side: relative → Next.js proxy handles it

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single in-flight refresh so parallel 401s don't rotate the token twice.
let refreshPromise = null;

async function refreshSession() {
  if (typeof window === "undefined") return false;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (!json?.token || !json?.refreshToken) return false;
    localStorage.setItem("jwt_token", json.token);
    localStorage.setItem("refresh_token", json.refreshToken);
    return true;
  } catch {
    return false;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    // Only skip the endpoints that must never trigger a refresh loop.
    // /api/auth/me must be retried: it is what restores the session with an
    // expired access token on first load.
    const url = typeof config?.url === "string" ? config.url : "";
    const noRefresh = /\/api\/auth\/(refresh|login|register|logout)$/.test(url);

    if (response?.status === 401 && config && !config._retried && !noRefresh && typeof window !== "undefined") {
      config._retried = true;
      refreshPromise = refreshPromise || refreshSession().finally(() => {
        refreshPromise = null;
      });
      if (await refreshPromise) return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;

/**
 * Drop-in `fetch` for same-app /api/* calls: attaches the JWT that `api`
 * would attach, so raw fetch calls don't have to know about auth.
 */
export function apiFetch(input, init = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
  const headers = { ...(init.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(input, { ...init, headers });
}
