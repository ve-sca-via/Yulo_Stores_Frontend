// Real network layer. Used when VITE_USE_MOCKS=false.
// (Lifted verbatim from the original App.jsx so behaviour is identical.)

import { API_BASE } from "./config";

const AUTH_TOKEN_KEY = "yulo_auth_token";

export function readToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (_error) {
    return null;
  }
}

export function storeToken(token) {
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function httpRequestJson(url, options = {}) {
  const token = readToken();
  const headers = { ...(options.headers ?? {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const payload = await response.json();

  // A rejected/expired token: drop it so the app falls back to the login screen.
  if (response.status === 401) {
    storeToken(null);
  }

  if (!response.ok || payload?.status === "error") {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}
