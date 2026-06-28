import client from "./client";

export const authApi = {
  // ── Owner / Customer ────────────────────────────────────────────────────
  signup: (body) => client.post("/auth/signup", body),
  login:  (body) => client.post("/auth/login", body),
  logout: ()     => client.post("/auth/logout"),
  refresh: ()    => client.post("/auth/refresh"),

  // ── Staff (PIN-based) ───────────────────────────────────────────────────
  // _staff: true tells the interceptor to attach the staff token, not the
  // owner access token.  Login itself needs no token.
  staffLogin:  ({ restaurantId, staffCode, pin }) =>
    client.post("/staff/auth/login", { restaurantId, staffCode, pin }),
  staffLogout: ()     => client.post("/staff/auth/logout", {}, { _staff: true }),
};
