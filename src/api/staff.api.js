import client from "./client";

// All staff routes require staffToken (sent via Authorization: Bearer header)
// Attach { _staff: true } so the request interceptor uses staffToken instead of accessToken

const S = { _staff: true };  // shorthand config flag

export const staffApi = {
  // ── Kitchen (Chef) ───────────────────────────────────────────────
  // GET /api/staff/:restaurantId/kitchen/queue
  // Returns orders in "pending" (upcoming) state
  getQueue: (restaurantId) =>
    client.get(`/staff/${restaurantId}/kitchen/queue`, S),

  // GET /api/staff/:restaurantId/kitchen/board
  // Returns { preparing: [], ready: [], completed: [] } buckets
  getBoard: (restaurantId) =>
    client.get(`/staff/${restaurantId}/kitchen/board`, S),

  // PATCH /api/staff/:restaurantId/kitchen/orders/:orderId/status
  // body: { orderStatus: "preparing" | "ready" | "completed" }
  updateOrderStatus: (restaurantId, orderId, newStatus) =>
    client.patch(
      `/staff/${restaurantId}/kitchen/orders/${orderId}/status`,
      { newStatus },
      S,
    ),

  // GET /api/staff/:restaurantId/kitchen/orders/:orderId
  getOrderDetail: (restaurantId, orderId) =>
    client.get(`/staff/${restaurantId}/kitchen/orders/${orderId}`, S),

  // ── Waiter ───────────────────────────────────────────────────────
  // GET /api/staff/:restaurantId/waiter/tables
  getTables: (restaurantId) =>
    client.get(`/staff/${restaurantId}/waiter/tables`, S),

  // POST /api/staff/:restaurantId/waiter/tables/scan
  // body: { qrPayload: string }
  scanTable: (restaurantId, qrPayload) =>
    client.post(`/staff/${restaurantId}/waiter/tables/scan`, { qrPayload }, S),

  // GET /api/staff/:restaurantId/waiter/menu
  getMenu: (restaurantId) =>
    client.get(`/staff/${restaurantId}/waiter/menu`, S),

  // POST /api/staff/:restaurantId/waiter/orders
  // body: { tableId, items: [{ menuItemId, quantity }], notes? }
  createOrder: (restaurantId, body) =>
    client.post(`/staff/${restaurantId}/waiter/orders`, body, S),

  // GET /api/staff/:restaurantId/waiter/sessions
  // Returns active table sessions with their orders
  getSessions: (restaurantId) =>
    client.get(`/staff/${restaurantId}/waiter/sessions`, S),

  // GET /api/staff/:restaurantId/waiter/sessions/:sessionId/bill
  getBill: (restaurantId, sessionId) =>
    client.get(`/staff/${restaurantId}/waiter/sessions/${sessionId}/bill`, S),

  // POST /api/staff/:restaurantId/waiter/sessions/:sessionId/bill/mark-paid
  // body: { paymentMethod: "cash" | "upi" | "card" }
  markPaid: (restaurantId, sessionId, paymentMethod = "cash") =>
    client.post(
      `/staff/${restaurantId}/waiter/sessions/${sessionId}/bill/mark-paid`,
      { paymentMethod },
      S,
    ),
};
