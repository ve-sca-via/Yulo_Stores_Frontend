import { createContext, useCallback, useContext, useState } from "react";
import { authApi } from "@/api/auth.api";
import { setStaffToken, getStaffToken } from "@/api/client";

// localStorage so the session survives tab closes and mobile browser restarts.
// Waiters/chefs work long shifts and shouldn't be forced to re-login on refresh.
const PROFILE_KEY = "yulo_staff_profile";

function readProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const [staff, setStaff] = useState(() => {
    const profile = readProfile();
    // Restore token into the client module so Axios interceptor picks it up.
    if (profile) getStaffToken(); // reads from localStorage internally
    return profile;
  });

  const login = useCallback(async ({ restaurantId, staffCode, pin }) => {
    const { data } = await authApi.staffLogin({ restaurantId, staffCode, pin });
    const { staffToken, role, name, staffCode: code } = data.data;
    setStaffToken(staffToken);
    const profile = { role, name, staffCode: code, restaurantId };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setStaff(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.staffLogout(); } catch { /* silent */ }
    setStaffToken(null);
    localStorage.removeItem(PROFILE_KEY);
    setStaff(null);
  }, []);

  return (
    <StaffAuthContext.Provider
      value={{ staff, login, logout, isAuthenticated: !!staff }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error("useStaffAuth must be inside StaffAuthProvider");
  return ctx;
}
