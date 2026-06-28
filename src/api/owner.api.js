import client from "./client";

// All owner routes are scoped under /owner/:restaurantId

export const ownerApi = {
  // ── Restaurants ───────────────────────────────────────────────────
  listRestaurants: () => client.get("/owner/restaurants"),
  createRestaurant: (body) => client.post("/owner/restaurants", body),

  // ── Dashboard ────────────────────────────────────────────────────
  getDashboardKPIs:    (rId)              => client.get(`/owner/${rId}/dashboard`),
  getSalesChart:       (rId, period="week") => client.get(`/owner/${rId}/dashboard/sales`, { params: { period } }),
  getTopItems:         (rId, limit=5)     => client.get(`/owner/${rId}/dashboard/top-items`, { params: { limit } }),
  getRecentOrders:     (rId, limit=10)    => client.get(`/owner/${rId}/dashboard/recent-orders`, { params: { limit } }),

  // ── Orders (read-only from owner view) ───────────────────────────
  listOrders: (rId, params={}) => client.get(`/owner/${rId}/orders`, { params }),
  getOrder:   (rId, orderId)   => client.get(`/owner/${rId}/orders/${orderId}`),

  // ── Bills ────────────────────────────────────────────────────────
  listBills: (rId, params={}) => client.get(`/owner/${rId}/bills`, { params }),
  getBill:   (rId, billId)    => client.get(`/owner/${rId}/bills/${billId}`),

  // ── Menu Items ───────────────────────────────────────────────────
  listMenuItems:      (rId, params={})        => client.get(`/owner/${rId}/menu-items`, { params }),
  getMenuItem:        (rId, itemId)           => client.get(`/owner/${rId}/menu-items/${itemId}`),
  createMenuItem:     (rId, formData)         => client.post(`/owner/${rId}/menu-items`, formData),
  updateMenuItem:     (rId, itemId, formData) => client.patch(`/owner/${rId}/menu-items/${itemId}`, formData),
  deleteMenuItem:     (rId, itemId)           => client.delete(`/owner/${rId}/menu-items/${itemId}`),
  toggleMenuItem:     (rId, itemId)           => client.patch(`/owner/${rId}/menu-items/${itemId}/toggle`),
  updateIngredients:  (rId, itemId, body)     => client.patch(`/owner/${rId}/menu-items/${itemId}/ingredients`, body),

  // ── Categories ───────────────────────────────────────────────────
  listCategories:      (rId)             => client.get(`/owner/${rId}/categories`),
  createCategory:      (rId, body)       => client.post(`/owner/${rId}/categories`, body),
  updateCategory:      (rId, cId, body)  => client.patch(`/owner/${rId}/categories/${cId}`, body),
  deleteCategory:      (rId, cId)        => client.delete(`/owner/${rId}/categories/${cId}`),
  listSubCategories:   (rId, cId)        => client.get(`/owner/${rId}/categories/${cId}/subcategories`),
  createSubCategory:   (rId, cId, body)  => client.post(`/owner/${rId}/categories/${cId}/subcategories`, body),
  updateSubCategory:   (rId, cId, sId, body) => client.patch(`/owner/${rId}/categories/${cId}/subcategories/${sId}`, body),
  deleteSubCategory:   (rId, cId, sId)  => client.delete(`/owner/${rId}/categories/${cId}/subcategories/${sId}`),

  // ── Tables + QR ──────────────────────────────────────────────────
  listTables:   (rId)              => client.get(`/owner/${rId}/tables`),
  createTable:  (rId, body)        => client.post(`/owner/${rId}/tables`, body),
  updateTable:  (rId, tableId, body) => client.patch(`/owner/${rId}/tables/${tableId}`, body),
  deleteTable:  (rId, tableId)     => client.delete(`/owner/${rId}/tables/${tableId}`),
  generateQR:   (rId, tableId)     => client.post(`/owner/${rId}/tables/${tableId}/qr`),
  voidQR:       (rId, tableId)     => client.patch(`/owner/${rId}/tables/${tableId}/qr/void`),

  // ── Discounts / Offers ───────────────────────────────────────────
  listDiscounts:   (rId)           => client.get(`/owner/${rId}/discounts`),
  createDiscount:  (rId, body)     => client.post(`/owner/${rId}/discounts`, body),
  updateDiscount:  (rId, dId, body) => client.patch(`/owner/${rId}/discounts/${dId}`, body),
  deleteDiscount:  (rId, dId)      => client.delete(`/owner/${rId}/discounts/${dId}`),
  publishDiscount: (rId, dId)      => client.patch(`/owner/${rId}/discounts/${dId}/publish`),
  draftDiscount:   (rId, dId)      => client.patch(`/owner/${rId}/discounts/${dId}/draft`),

  // ── Settings ─────────────────────────────────────────────────────
  getSettings:      (rId)       => client.get(`/owner/${rId}/settings`),
  updateSettings:   (rId, body) => client.patch(`/owner/${rId}/settings`, body),
  getHours:         (rId)       => client.get(`/owner/${rId}/settings/hours`),
  updateHours:      (rId, body) => client.patch(`/owner/${rId}/settings/hours`, body),
  getDelivery:      (rId)       => client.get(`/owner/${rId}/settings/delivery`),
  updateDelivery:   (rId, body) => client.patch(`/owner/${rId}/settings/delivery`, body),

  // ── Staff ────────────────────────────────────────────────────────
  listStaff:    (rId)               => client.get(`/owner/${rId}/staff`),
  createStaff:  (rId, body)         => client.post(`/owner/${rId}/staff`, body),
  updateStaff:  (rId, staffId, body) => client.patch(`/owner/${rId}/staff/${staffId}`, body),
  removeStaff:  (rId, staffId)      => client.delete(`/owner/${rId}/staff/${staffId}`),

  // ── Live Monitor ─────────────────────────────────────────────────
  getLiveStats:      (rId) => client.get(`/owner/${rId}/live-monitor`),
  getLiveVisitors:   (rId) => client.get(`/owner/${rId}/live-monitor/visitors`),
  getLiveRepeat:     (rId) => client.get(`/owner/${rId}/live-monitor/repeat`),
  createTargetOffer: (rId, body) => client.post(`/owner/${rId}/live-monitor/offer`, body),

  // ── Restaurant Details ───────────────────────────────────────────
  getRestaurantDetail: (rId) => client.get(`/owner/${rId}/restaurant`),
  updateRestaurant:    (rId, body) => client.patch(`/owner/${rId}/restaurant`, body),
};
