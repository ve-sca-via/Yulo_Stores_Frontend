import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "@/api/auth.api";
import { ownerApi } from "@/api/owner.api";
import { setAccessToken, getAccessToken } from "@/api/client";

const PROFILE_KEY = "yulo_owner_profile";
const RESTAURANT_KEY = "yulo_owner_restaurant";

function readProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readRestaurant() {
  try {
    const raw = localStorage.getItem(RESTAURANT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const OwnerAuthContext = createContext(null);

export function OwnerAuthProvider({ children }) {
  const [user, setUser] = useState(() => readProfile());
  const [restaurant, setRestaurant] = useState(() => readRestaurant());
  const [loading, setLoading] = useState(true);
  // Tracks when an access token is actually available in memory.
  // setAccessToken() writes to a plain variable — not React state — so without
  // this flag, the restaurant-fetch effect would never re-run after a token
  // refresh on page reload (the effect deps [user, restaurant] don't change).
  const [tokenReady, setTokenReady] = useState(() => !!getAccessToken());

  // Persist restaurant to localStorage whenever it changes
  useEffect(() => {
    if (restaurant) localStorage.setItem(RESTAURANT_KEY, JSON.stringify(restaurant));
    else localStorage.removeItem(RESTAURANT_KEY);
  }, [restaurant]);

  useEffect(() => {
    if (user) localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    else localStorage.removeItem(PROFILE_KEY);
  }, [user]);

  // On mount: if profile exists but token is gone (page refresh), silently refresh.
  // Sets tokenReady so the restaurant-fetch effect below re-runs once the token lands.
  useEffect(() => {
    if (user && !getAccessToken()) {
      authApi.refresh()
        .then(({ data }) => {
          setAccessToken(data.data.accessToken);
          setTokenReady(true);
        })
        .catch(() => {
          setUser(null);
          setRestaurant(null);
          setTokenReady(false);
          localStorage.removeItem(PROFILE_KEY);
          localStorage.removeItem(RESTAURANT_KEY);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // After we have a token and no restaurant yet, fetch the owner's restaurants
  // and pick the first one. Depends on tokenReady so it re-runs after the
  // token refresh above completes (not just when user/restaurant state changes).
  useEffect(() => {
    if (!user || !tokenReady || restaurant) return;

    ownerApi.listRestaurants()
      .then(({ data }) => {
        const list = data.data.restaurants ?? [];
        if (list.length > 0) setRestaurant(list[0]);
      })
      .catch(() => { /* non-critical — dashboard will handle empty state */ });
  }, [user, tokenReady, restaurant]);

  // ── fetchRestaurants: exposed so owner dashboard can trigger a re-fetch
  const fetchRestaurants = useCallback(async () => {
    const { data } = await ownerApi.listRestaurants();
    const list = data.data.restaurants ?? [];
    if (list.length > 0) setRestaurant(list[0]);
    return list;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await authApi.login({ email, password });
    const { user: u, accessToken } = data.data;
    setAccessToken(accessToken);
    setTokenReady(true);
    setUser(u);
    try {
      const { data: rData } = await ownerApi.listRestaurants();
      const list = rData.data.restaurants ?? [];
      if (list.length > 0) setRestaurant(list[0]);
    } catch { /* non-critical */ }
    return u;
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const { data } = await authApi.signup({ name, email, password, role: "restaurant_owner" });
    const { user: u, accessToken } = data.data;
    setAccessToken(accessToken);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* silent */ }
    setAccessToken(null);
    setTokenReady(false);
    setUser(null);
    setRestaurant(null);
  }, []);

  return (
    <OwnerAuthContext.Provider
      value={{
        user,
        restaurant,
        restaurantId: restaurant?._id ?? restaurant?.id ?? null,
        loading,
        login,
        signup,
        logout,
        fetchRestaurants,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  const ctx = useContext(OwnerAuthContext);
  if (!ctx) throw new Error("useOwnerAuth must be inside OwnerAuthProvider");
  return ctx;
}

// Safe version — returns null when called outside OwnerAuthProvider (e.g. manager screens)
export function useOwnerAuthSafe() {
  return useContext(OwnerAuthContext);
}
