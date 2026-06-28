import client from "./client";
// Customer uses the same access token flow as owner (email/password → JWT)
// Public restaurant endpoints need no token (no Authorization header needed)

export const customerApi = {
  // ── Auth (reuses /api/auth/* — same as owner) ─────────────────────
  // Customer signs up with role: "customer"
  signup: (body) => client.post("/auth/signup", { ...body, role: "customer" }),
  login:  (body) => client.post("/auth/login", body),
  logout: ()     => client.post("/auth/logout"),
  refresh: ()    => client.post("/auth/refresh"),

  // ── Public Restaurant & Menu (no auth) ────────────────────────────
  // GET /api/restaurants/:id/menu → { categories, items }
  getMenu: (restaurantId) =>
    client.get(`/restaurants/${restaurantId}/menu`),

  getRestaurant: (restaurantId) =>
    client.get(`/restaurants/${restaurantId}`),

  getReviews: (restaurantId, params={}) =>
    client.get(`/restaurants/${restaurantId}/reviews`, { params }),

  // ── Customer Orders ───────────────────────────────────────────────
  // POST /api/orders — place a new order
  createOrder: (body) => client.post("/orders", body),

  // GET /api/orders — list the logged-in customer's orders
  listOrders: (params={}) => client.get("/orders", { params }),

  // GET /api/orders/:id — get single order (used for polling)
  getOrder: (orderId) => client.get(`/orders/${orderId}`),

  // ── User Profile ──────────────────────────────────────────────────
  getMe:       ()     => client.get("/users/me"),
  updateMe:    (body) => client.patch("/users/me", body),
  addAddress:  (body) => client.post("/users/me/addresses", body),
  removeAddress: (addrId) => client.delete(`/users/me/addresses/${addrId}`),
};
