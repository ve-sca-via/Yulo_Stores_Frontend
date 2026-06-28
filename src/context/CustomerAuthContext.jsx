import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { customerApi } from "@/api/customer.api";
import { setAccessToken, getAccessToken } from "@/api/client";

// Customer auth uses the same JWT flow as the owner.
// The server's /api/auth/* endpoints work for all roles — role is encoded in the token.
// Access token stored in memory, refresh token in HttpOnly cookie.
// Customer profile in localStorage (non-sensitive display data).

const PROFILE_KEY = "yulo_customer_profile";

function readProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => readProfile());
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (customer) localStorage.setItem(PROFILE_KEY, JSON.stringify(customer));
    else          localStorage.removeItem(PROFILE_KEY);
  }, [customer]);

  // On mount: silent refresh if profile exists but token is gone (page reload)
  useEffect(() => {
    if (customer && !getAccessToken()) {
      customerApi.refresh()
        .then(({ data }) => setAccessToken(data.data.accessToken))
        .catch(() => { setCustomer(null); localStorage.removeItem(PROFILE_KEY); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async ({ email, password }) => {
    const { data } = await customerApi.login({ email, password });
    const { user: u, accessToken } = data.data;
    setAccessToken(accessToken);
    setCustomer(u);
    return u;
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const { data } = await customerApi.signup({ name, email, password });
    const { user: u, accessToken } = data.data;
    setAccessToken(accessToken);
    setCustomer(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await customerApi.logout(); } catch { /* silent */ }
    setAccessToken(null);
    setCustomer(null);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{ customer, loading, login, signup, logout, isAuthenticated: !!customer }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be inside CustomerAuthProvider");
  return ctx;
}
