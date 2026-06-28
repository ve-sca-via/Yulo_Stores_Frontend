// ---------------------------------------------------------------------------
// MOCK BACKEND
// ---------------------------------------------------------------------------
// A tiny in-browser stand-in for the real server. It matches "METHOD /path"
// against the handlers below, mutates an in-memory store seeded from data.js,
// and returns the same { status, message, data } envelope the real backend
// uses — so the UI cannot tell the difference.
//
// State lives in memory and resets on full page reload. That is intentional:
// a clean, predictable dataset every run while you build screens.
//
// Adding a new endpoint = add one entry to the `routes` array. When the real
// API for it ships, you can delete the mock entry and flip VITE_USE_MOCKS=false.

import { MOCK_LATENCY_MS } from "../api/config";
import { createSeed } from "./data";

let db = createSeed();

let idCounter = 0;
function genId(prefix) {
  idCounter += 1;
  return `${prefix}_${Date.now()}${idCounter}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ok(message, data = {}) {
  return { status: "success", message, data };
}

// Thrown errors surface to the UI's catch blocks as error.message — same as a
// failed real request.
function fail(message) {
  throw new Error(message);
}

function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Collapses the full order lifecycle into the four kitchen-display buckets the
// Chef Dashboard shows.
function chefStateOf(status) {
  if (status === "preparing") return "preparing";
  if (status === "ready") return "ready";
  if (status === "served" || status === "completed") return "completed";
  return "pending";
}

// Human label for the waiter's active-tables list.
function waiterStatusOf(order) {
  if (order.paymentStatus === "paid") return "Paid & Clearing";
  if (order.orderStatus === "ready") return "Ready to serve";
  if (order.orderStatus === "served") return "Served";
  return "Preparing";
}

function resolveItems(items) {
  // Turn [{ recipeId, quantity }] into full order lines using the menu.
  return items.map((line) => {
    const recipe = db.restaurant.recipies.find(
      (recipe) => recipe.id === line.recipeId,
    );
    return {
      recipeId: line.recipeId,
      title: recipe?.title ?? "Unknown item",
      price: recipe?.price ?? 0,
      quantity: Number(line.quantity) || 0,
    };
  });
}

function buildAnalytics() {
  const paidOrders = db.orders.filter((o) => o.paymentStatus === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + orderTotal(o), 0);
  const inventoryCost = db.inventory.reduce(
    (sum, i) => sum + i.quantity * i.price,
    0,
  );
  const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  const averageMenuPrice = db.restaurant.recipies.length
    ? db.restaurant.recipies.reduce((sum, r) => sum + r.price, 0) /
      db.restaurant.recipies.length
    : 0;

  const expenseBreakdownMap = {};
  for (const expense of db.expenses) {
    const tags = expense.tags?.length ? expense.tags : ["untagged"];
    for (const tag of tags) {
      expenseBreakdownMap[tag] = (expenseBreakdownMap[tag] ?? 0) + expense.amount;
    }
  }

  return {
    summary: {
      totalRevenue,
      totalPaidOrders: paidOrders.length,
      inventoryCost,
      estimatedGrossMargin: totalRevenue - inventoryCost,
      totalExpenses,
      estimatedNetAfterExpenses: totalRevenue - inventoryCost - totalExpenses,
      averageMenuPrice,
    },
    unavailableItems: db.inventory.filter((i) => i.available === false),
    lowStockItems: db.inventory.filter((i) => i.quantity <= 5),
    recentMovements: [...db.movements].reverse().slice(0, 10),
    recentExpenses: [...db.expenses].reverse().slice(0, 10),
    expenseBreakdown: Object.entries(expenseBreakdownMap).map(([tag, amount]) => ({
      tag,
      amount,
    })),
  };
}

function publicRestaurant() {
  // Shape the UI reads for menu/customer/waiter views.
  return {
    id: db.restaurant.id,
    name: db.restaurant.name,
    owner: db.restaurant.owner,
    recipies: db.restaurant.recipies,
    staffMembers: db.restaurant.staffMembers,
  };
}

function qrImageDataUri(label) {
  // A lightweight placeholder "QR" so the flow works fully offline.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="#ffffff"/>
    <rect x="20" y="20" width="160" height="160" fill="none" stroke="#111" stroke-width="8"/>
    <text x="100" y="105" font-family="monospace" font-size="20" text-anchor="middle" fill="#111">QR ${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Each route: HTTP method, a path regex (capture groups -> params), handler.
const routes = [
  // ---- Owner auth -------------------------------------------------------
  {
    method: "POST",
    path: /^\/restaurant_owner\/(login|signup)$/,
    handler: ({ body }) => {
      const owner = {
        ...db.owner,
        ...(body.name ? { name: body.name } : {}),
        ...(body.email ? { email: body.email } : {}),
      };
      delete owner.password;
      return ok("Owner authenticated", {
        token: genId("token"),
        owner: { ...owner, restaurant: publicRestaurant() },
      });
    },
  },
  {
    method: "POST",
    path: /^\/restaurant_owner\/logout$/,
    handler: () => ok("Logged out"),
  },
  {
    method: "POST",
    path: /^\/restaurant_owner\/register_restaurant$/,
    handler: ({ body }) => {
      db.restaurant.name = body.name || db.restaurant.name;
      return ok("Restaurant registered", { restaurant: publicRestaurant() });
    },
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/profile\/([^/]+)$/,
    handler: ({ body }) => {
      if (body.name) db.owner.name = body.name;
      if (body.email) db.owner.email = body.email;
      const owner = { ...db.owner };
      delete owner.password;
      return ok("Profile updated", {
        owner: { ...owner, restaurant: publicRestaurant() },
      });
    },
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/restaurant$/,
    handler: ({ body }) => {
      if (body.name) db.restaurant.name = body.name;
      return ok("Restaurant updated", { restaurant: publicRestaurant() });
    },
  },

  // ---- Staff ------------------------------------------------------------
  {
    method: "POST",
    path: /^\/restaurant_owner\/employees$/,
    handler: ({ body }) => {
      db.restaurant.staffMembers.push({
        id: genId("stf"),
        role: body.role,
        name: body.name,
        email: body.email,
        employeeId: body.employeeId,
      });
      return ok("Staff member added", { restaurant: publicRestaurant() });
    },
  },
  {
    method: "DELETE",
    path: /^\/restaurant_owner\/members\/([^/]+)$/,
    handler: ({ params }) => {
      db.restaurant.staffMembers = db.restaurant.staffMembers.filter(
        (member) => member.id !== params[0],
      );
      return ok("Staff member removed", { restaurant: publicRestaurant() });
    },
  },
  {
    method: "POST",
    path: /^\/restaurant_owner\/employees\/login$/,
    handler: ({ body }) => {
      const id = String(body.employeeId ?? "");
      const role = id.toLowerCase().startsWith("waiter") ? "waiter" : "chef";
      const member =
        db.restaurant.staffMembers.find((m) => m.employeeId === id) ?? {
          id: genId("stf"),
          role,
          name: role === "waiter" ? "Waiter" : "Chef",
          email: `${id}@yulo.test`,
          employeeId: id,
        };
      return ok("Employee authenticated", {
        token: genId("token"),
        member,
        restaurant: { id: db.restaurant.id, name: db.restaurant.name },
        portal: member.role,
      });
    },
  },

  // ---- Menu -------------------------------------------------------------
  {
    method: "GET",
    path: /^\/api\/restaurants\/([^/]+)\/menu$/,
    handler: () => ok("Menu loaded", { restaurant: publicRestaurant() }),
  },
  {
    method: "GET",
    path: /^\/waiter\/restaurants\/([^/]+)\/menu$/,
    handler: () => ok("Menu loaded", { restaurant: publicRestaurant() }),
  },
  {
    method: "POST",
    path: /^\/restaurant_owner\/add_item$/,
    handler: ({ body }) => {
      db.restaurant.recipies.push({
        id: genId("rec"),
        title: body.title,
        ingredients: body.ingredients ?? [],
        price: Number(body.price) || 0,
      });
      return ok("Menu item added", { restaurantId: db.restaurant.id });
    },
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/menu\/([^/]+)$/,
    handler: ({ params, body }) => {
      const item = db.restaurant.recipies.find((r) => r.id === params[0]);
      if (!item) fail("Menu item not found");
      item.title = body.title ?? item.title;
      item.ingredients = body.ingredients ?? item.ingredients;
      item.price = Number(body.price) || item.price;
      return ok("Menu item updated", { restaurantId: db.restaurant.id });
    },
  },
  {
    method: "DELETE",
    path: /^\/restaurant_owner\/menu\/([^/]+)$/,
    handler: ({ params }) => {
      db.restaurant.recipies = db.restaurant.recipies.filter(
        (r) => r.id !== params[0],
      );
      return ok("Menu item removed", { restaurantId: db.restaurant.id });
    },
  },

  // ---- QR ---------------------------------------------------------------
  {
    method: "POST",
    path: /^\/restaurant_owner\/generate_qr$/,
    handler: ({ body }) => {
      const base = body.baseUrl || window.location.origin;
      const link = `${base}/menu?restaurantId=${db.restaurant.id}&tableNumber=${encodeURIComponent(body.tableNumber)}`;
      return ok("QR generated", {
        tableNumber: body.tableNumber,
        link,
        qrImageUrl: qrImageDataUri(body.tableNumber),
      });
    },
  },

  // ---- Inventory --------------------------------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/inventory$/,
    handler: () => ok("Inventory loaded", { inventory: db.inventory }),
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/inventory\/([^/]+)$/,
    handler: ({ params, body }) => {
      const item = db.inventory.find((i) => i.id === params[0]);
      if (!item) fail("Inventory item not found");
      item.name = body.name ?? item.name;
      item.quantity = Number(body.quantity);
      item.unit = body.unit ?? item.unit;
      item.price = Number(body.price);
      item.available = body.available;
      return ok("Inventory updated", { restaurantId: db.restaurant.id });
    },
  },
  {
    method: "DELETE",
    path: /^\/restaurant_owner\/inventory\/([^/]+)$/,
    handler: ({ params }) => {
      db.inventory = db.inventory.filter((i) => i.id !== params[0]);
      return ok("Inventory item removed", { restaurantId: db.restaurant.id });
    },
  },
  {
    method: "POST",
    path: /^\/restaurant_owner\/inventory\/([^/]+)\/movements$/,
    handler: ({ params, body }) => {
      const item = db.inventory.find((i) => i.id === params[0]);
      if (!item) fail("Inventory item not found");
      const change =
        body.type === "restock" ? Number(body.quantity) : -Number(body.quantity);
      item.quantity = Math.max(0, item.quantity + change);
      db.movements.push({
        id: genId("mov"),
        inventoryId: item.id,
        inventoryName: item.name,
        type: body.type,
        quantityChange: change,
        unit: item.unit,
        note: body.note ?? "",
        createdAt: new Date().toISOString(),
      });
      return ok("Stock movement recorded", { restaurantId: db.restaurant.id });
    },
  },

  // ---- Expenses ---------------------------------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/expenses$/,
    handler: () => ok("Expenses loaded", { expenses: db.expenses }),
  },
  {
    method: "POST",
    path: /^\/restaurant_owner\/add_expense$/,
    handler: ({ body }) => {
      db.expenses.push({
        id: genId("exp"),
        title: body.title,
        amount: Number(body.amount) || 0,
        tags: body.tags ?? [],
        note: body.note ?? "",
        time: new Date().toISOString(),
      });
      return ok("Expense added", { restaurantId: db.restaurant.id });
    },
  },
  {
    method: "DELETE",
    path: /^\/restaurant_owner\/expenses\/([^/]+)$/,
    handler: ({ params }) => {
      db.expenses = db.expenses.filter((e) => e.id !== params[0]);
      return ok("Expense removed", { restaurantId: db.restaurant.id });
    },
  },

  // ---- Analytics --------------------------------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/analytics$/,
    handler: () => ok("Analytics loaded", buildAnalytics()),
  },

  // ---- Dashboard (Figma owner dashboard screen) -------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/dashboard$/,
    handler: () => ok("Dashboard loaded", db.dashboard),
  },

  // ---- Menu management (Figma menu management screen) -------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/menu-management$/,
    handler: () => ok("Menu management loaded", db.menuManagement),
  },

  // ---- Bill details (Figma node 173:1047) -------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/bill$/,
    handler: () => ok("Bill loaded", db.billDetails),
  },

  // ---- Orders (owner) ---------------------------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/orders$/,
    handler: () =>
      ok("Orders loaded", {
        totalOrders: db.orders.length,
        orders: db.orders,
      }),
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/orders\/([^/]+)\/payment$/,
    handler: ({ params, body }) => {
      const order = db.orders.find((o) => o.id === params[0]);
      if (!order) fail("Order not found");
      const wasUnpaid = order.paymentStatus !== "paid";
      order.paymentStatus = body.paymentStatus ?? "paid";

      // Reflect payment in dashboard stats
      if (wasUnpaid && order.paymentStatus === "paid") {
        const amount = orderTotal(order);
        const d = db.dashboard;

        // Revenue
        const prevRev = parseInt((d.stats.revenue.value ?? "0").replace(/[^\d]/g, "")) || 0;
        d.stats.revenue.value = "₹" + (prevRev + amount).toLocaleString("en-IN");

        // Total orders
        d.stats.totalOrders.value = String((parseInt(d.stats.totalOrders.value) || 0) + 1);

        // Order breakdown: +1 Delivered, -1 Preparing
        const delivered = d.orderBreakdown.segments.find((s) => s.label === "Delivered");
        const preparing = d.orderBreakdown.segments.find((s) => s.label === "Preparing");
        if (delivered) delivered.value += 1;
        if (preparing && preparing.value > 0) preparing.value -= 1;
        d.orderBreakdown.total = String((parseInt(d.orderBreakdown.total) || 0) + 1);

        // Kitchen pills: +1 Completed, -1 Pending
        const completedPill = d.kitchen.pills.find((p) => p.label === "Completed");
        const pendingPill = d.kitchen.pills.find((p) => p.label === "Pending");
        if (completedPill) completedPill.value = String((parseInt(completedPill.value) || 0) + 1);
        if (pendingPill && parseInt(pendingPill.value) > 0)
          pendingPill.value = String(parseInt(pendingPill.value) - 1);

        // Add to kitchen queue
        d.kitchen.queue.unshift({
          table: order.tableNumber ? `T-${order.tableNumber}` : "Online",
          items: order.items.map((i) => i.title).join(", "),
          status: "PAID",
          time: "just now",
          action: "View Bill",
        });
        if (d.kitchen.queue.length > 5) d.kitchen.queue.pop();
      }

      return ok("Payment status updated", { order });
    },
  },
  {
    method: "GET",
    path: /^\/restaurant_owner\/orders\/([^/]+)\/bill$/,
    handler: ({ params }) => {
      const order = db.orders.find((o) => o.id === params[0]);
      if (!order) fail("Order not found");
      const items = order.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.price * item.quantity,
      }));
      return ok("Bill generated", {
        bill: {
          billNumber: `BILL-${order.id.slice(-6)}`,
          generatedAt: new Date().toISOString(),
          restaurant: { name: db.restaurant.name },
          order: {
            id: order.id,
            tableNumber: order.tableNumber,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
          },
          items,
          total: orderTotal(order),
        },
      });
    },
  },

  // ---- Orders (chef) ----------------------------------------------------
  {
    method: "GET",
    path: /^\/chef\/orders$/,
    handler: () =>
      ok("Orders loaded", {
        totalOrders: db.orders.length,
        orders: db.orders,
      }),
  },
  {
    method: "PATCH",
    path: /^\/chef\/orders\/([^/]+)\/status$/,
    handler: ({ params, body }) => {
      const order = db.orders.find((o) => o.id === params[0]);
      if (!order) fail("Order not found");
      order.orderStatus = body.orderStatus;
      return ok("Order status updated", { order });
    },
  },

  // ---- Orders (waiter) --------------------------------------------------
  {
    method: "GET",
    path: /^\/waiter\/orders\/pending$/,
    handler: ({ query }) => {
      const order = db.orders.find(
        (o) =>
          o.tableNumber === query.tableNumber &&
          o.paymentStatus === "pending",
      );
      return ok("Pending order loaded", { order: order ?? null });
    },
  },
  {
    method: "POST",
    path: /^\/waiter\/orders$/,
    handler: ({ body }) => {
      const items = resolveItems(body.items ?? []);
      let order = db.orders.find(
        (o) => o.tableNumber === body.tableNumber && o.paymentStatus === "pending",
      );
      if (order) {
        // Merge into the existing pending order for that table.
        for (const line of items) {
          const existing = order.items.find((i) => i.recipeId === line.recipeId);
          if (existing) existing.quantity += line.quantity;
          else order.items.push(line);
        }
      } else {
        order = {
          id: genId("ord"),
          tableNumber: body.tableNumber,
          time: new Date().toISOString(),
          orderStatus: "new",
          paymentStatus: "pending",
          items,
        };
        db.orders.push(order);
      }
      return ok("Order saved", { order });
    },
  },
  {
    method: "PATCH",
    path: /^\/waiter\/orders\/([^/]+)\/payment$/,
    handler: ({ params, body }) => {
      const order = db.orders.find((o) => o.id === params[0]);
      if (!order) fail("Order not found");
      order.paymentStatus = body.paymentStatus ?? "paid";
      return ok("Payment status updated", { order });
    },
  },

  // ---- Customer (QR) ----------------------------------------------------
  {
    method: "POST",
    path: /^\/api\/orders$/,
    handler: ({ body }) => {
      const order = {
        id: genId("ord"),
        tableNumber: body.tableNumber,
        time: new Date().toISOString(),
        orderStatus: "new",
        paymentStatus: "pending",
        items: resolveItems(body.items ?? []),
      };
      db.orders.push(order);
      return ok("Order placed", { order });
    },
  },

  // ---- QR management (owner screen) -------------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/qr-codes$/,
    handler: () =>
      ok("QR codes loaded", {
        codes: db.qrCodes.map((qr) => ({
          ...qr,
          link: `${window.location.origin}/menu?restaurantId=${db.restaurant.id}${qr.context ? `&tableNumber=${encodeURIComponent(qr.context)}` : ""}`,
          qrImageUrl: qrImageDataUri(qr.context || qr.label),
        })),
      }),
  },
  {
    method: "POST",
    path: /^\/restaurant_owner\/qr-codes$/,
    handler: ({ body }) => {
      const qr = {
        id: genId("qr"),
        label: body.label || `Table ${db.qrCodes.length + 1}`,
        type: body.type || "table",
        context: body.context || "",
        active: true,
        scans: 0,
        createdAt: new Date().toISOString(),
      };
      db.qrCodes.push(qr);
      return ok("QR code generated", { code: qr });
    },
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/qr-codes\/([^/]+)$/,
    handler: ({ params, body }) => {
      const qr = db.qrCodes.find((q) => q.id === params[0]);
      if (!qr) fail("QR code not found");
      if (typeof body.active === "boolean") qr.active = body.active;
      return ok("QR code updated", { code: qr });
    },
  },
  {
    method: "DELETE",
    path: /^\/restaurant_owner\/qr-codes\/([^/]+)$/,
    handler: ({ params }) => {
      db.qrCodes = db.qrCodes.filter((q) => q.id !== params[0]);
      return ok("QR code removed", { restaurantId: db.restaurant.id });
    },
  },

  // ---- Offers & coupons (owner screen) ----------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/offers$/,
    handler: () => ok("Offers loaded", { offers: db.offers, items: db.offerMeta.items }),
  },
  {
    method: "POST",
    path: /^\/restaurant_owner\/offers$/,
    handler: ({ body }) => {
      const offer = {
        id: genId("off"),
        name: body.name ?? "Untitled offer",
        type: body.type ?? "coupon",
        code: body.code ?? "",
        discountType: body.discountType ?? "percent",
        discountValue: Number(body.discountValue) || 0,
        item: body.item ?? "",
        minOrder: Number(body.minOrder) || 0,
        applicableFor: body.applicableFor ?? "both",
        validFrom: body.validFrom ?? "",
        validTo: body.validTo ?? "",
        status: body.status ?? "active",
        description: body.description ?? "",
        image: body.image ?? "",
      };
      db.offers.unshift(offer);
      return ok("Offer created", { offer });
    },
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/offers\/([^/]+)$/,
    handler: ({ params, body }) => {
      const offer = db.offers.find((o) => o.id === params[0]);
      if (!offer) fail("Offer not found");
      Object.assign(offer, body);
      return ok("Offer updated", { offer });
    },
  },
  {
    method: "DELETE",
    path: /^\/restaurant_owner\/offers\/([^/]+)$/,
    handler: ({ params }) => {
      db.offers = db.offers.filter((o) => o.id !== params[0]);
      return ok("Offer removed", { restaurantId: db.restaurant.id });
    },
  },

  // ---- Manage orders (owner screen) -------------------------------------
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/orders\/([^/]+)\/status$/,
    handler: ({ params, body }) => {
      const order = db.orders.find((o) => o.id === params[0]);
      if (!order) fail("Order not found");
      order.orderStatus = body.orderStatus;
      return ok("Order status updated", { order });
    },
  },

  // ---- Cancellations (owner screen) -------------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/cancellations$/,
    handler: () => ok("Cancellations loaded", { cancellations: db.cancellations }),
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/cancellations\/([^/]+)$/,
    handler: ({ params, body }) => {
      const entry = db.cancellations.find((c) => c.id === params[0]);
      if (!entry) fail("Cancellation not found");
      entry.status = body.status ?? entry.status;
      entry.type = body.status === "approved" ? "cancelled" : body.status === "rejected" ? "rejected" : entry.type;
      return ok("Cancellation updated", { cancellation: entry });
    },
  },

  // ---- Menu items catalog (owner screen) --------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/menu-items$/,
    handler: () => ok("Menu items loaded", { items: db.menuManagement.currentItems }),
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/menu-items\/([^/]+)$/,
    handler: ({ params, body }) => {
      const item = db.menuManagement.currentItems.find((i) => i.id === params[0]);
      if (!item) fail("Menu item not found");
      if (typeof body.available === "boolean") item.available = body.available;
      return ok("Menu item updated", { item });
    },
  },

  // ---- Store settings (owner screen) ------------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/store-settings$/,
    handler: () => ok("Store settings loaded", db.storeSettings),
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/store-settings$/,
    handler: ({ body }) => {
      db.storeSettings = { ...db.storeSettings, ...body };
      return ok("Store settings saved", db.storeSettings);
    },
  },

  // ---- Owner profile (owner screen) -------------------------------------
  {
    method: "GET",
    path: /^\/restaurant_owner\/profile$/,
    handler: () => ok("Profile loaded", db.ownerProfile),
  },
  {
    method: "PATCH",
    path: /^\/restaurant_owner\/profile$/,
    handler: ({ body }) => {
      const { password: _password, ...rest } = body;
      db.ownerProfile = { ...db.ownerProfile, ...rest };
      return ok("Profile saved", db.ownerProfile);
    },
  },

  // ---- Chef dashboard (kitchen display) ---------------------------------
  {
    method: "GET",
    path: /^\/chef\/dashboard$/,
    handler: () => {
      const cards = db.orders
        .map((order) => ({
          id: order.id,
          number: order.id.slice(-3),
          table: order.tableNumber || "—",
          orderType: order.orderType ?? (order.tableNumber ? "dine-in" : "counter"),
          time: order.time,
          status: chefStateOf(order.orderStatus),
          orderStatus: order.orderStatus,
          items: order.items.map((i) => ({ quantity: i.quantity, title: i.title })),
          instructions: order.items
            .map((i) => i.instructions)
            .filter(Boolean)
            .join(" "),
        }))
        .filter((card) => card.status !== "completed");
      const countBy = (state) =>
        db.orders.filter((o) => chefStateOf(o.orderStatus) === state).length;
      return ok("Kitchen dashboard loaded", {
        counts: {
          pending: countBy("pending"),
          preparing: countBy("preparing"),
          ready: countBy("ready"),
          completed: countBy("completed"),
        },
        orders: cards,
      });
    },
  },

  // ---- Waiter dashboard (light-sidebar portal) --------------------------
  {
    method: "GET",
    path: /^\/waiter\/tables$/,
    handler: () => {
      // Group active (non-paid) orders by table for the billing list.
      const byTable = {};
      for (const order of db.orders) {
        const key = order.tableNumber || "—";
        if (!byTable[key]) byTable[key] = [];
        byTable[key].push(order);
      }
      const tables = Object.entries(byTable).map(([table, orders]) => {
        const latest = orders[orders.length - 1];
        const items = latest.items.map((i) => `${i.quantity}x ${i.title}`).join(", ");
        return {
          table,
          status: waiterStatusOf(latest),
          items,
          total: orders.reduce((sum, o) => sum + orderTotal(o), 0),
          paymentStatus: latest.paymentStatus,
          orderId: latest.id,
        };
      });
      return ok("Tables loaded", { tables });
    },
  },
  {
    method: "GET",
    path: /^\/waiter\/menu-display$/,
    handler: () =>
      ok("Menu loaded", {
        categories: db.customerMenu.categories,
        items: db.customerMenu.items,
      }),
  },

  // ---- Platform admin portal --------------------------------------------
  {
    method: "GET",
    path: /^\/admin\/dashboard$/,
    handler: () =>
      ok("Admin dashboard loaded", {
        stats: db.admin.stats,
        health: db.admin.health,
        recentRestaurants: db.admin.restaurants.slice(0, 4),
        recentActivity: db.admin.activity.slice(0, 5),
      }),
  },
  {
    method: "GET",
    path: /^\/admin\/restaurants$/,
    handler: () => ok("Restaurants loaded", { restaurants: db.admin.restaurants }),
  },
  {
    method: "POST",
    path: /^\/admin\/restaurants$/,
    handler: ({ body }) => {
      const restaurant = {
        id: genId("rest"),
        name: body.name,
        owner: body.owner ?? "Unassigned",
        ownerEmail: body.ownerEmail ?? "",
        city: body.city ?? "",
        status: "active",
        plan: body.plan ?? "Starter",
        orders: 0,
        joinedAt: new Date().toISOString().slice(0, 10),
      };
      db.admin.restaurants.unshift(restaurant);
      db.admin.stats.totalRestaurants += 1;
      db.admin.stats.activeRestaurants += 1;
      return ok("Restaurant added", { restaurant });
    },
  },
  {
    method: "PATCH",
    path: /^\/admin\/restaurants\/([^/]+)$/,
    handler: ({ params, body }) => {
      const restaurant = db.admin.restaurants.find((r) => r.id === params[0]);
      if (!restaurant) fail("Restaurant not found");
      if (body.status) restaurant.status = body.status;
      if (body.owner) restaurant.owner = body.owner;
      const active = db.admin.restaurants.filter((r) => r.status === "active").length;
      db.admin.stats.activeRestaurants = active;
      db.admin.stats.inactiveRestaurants = db.admin.restaurants.length - active;
      return ok("Restaurant updated", { restaurant });
    },
  },
  {
    method: "GET",
    path: /^\/admin\/users$/,
    handler: () => ok("Users loaded", { users: db.admin.users }),
  },
  {
    method: "GET",
    path: /^\/admin\/roles$/,
    handler: () => ok("Roles loaded", { roles: db.admin.roles }),
  },
  {
    method: "GET",
    path: /^\/admin\/orders$/,
    handler: () => ok("Orders loaded", { orders: db.admin.orders }),
  },
  {
    method: "GET",
    path: /^\/admin\/offers$/,
    handler: () => ok("Offers loaded", { offers: db.admin.offers }),
  },
  {
    method: "PATCH",
    path: /^\/admin\/offers\/([^/]+)$/,
    handler: ({ params, body }) => {
      const offer = db.admin.offers.find((o) => o.id === params[0]);
      if (!offer) fail("Offer not found");
      offer.status = body.status ?? offer.status;
      return ok("Offer updated", { offer });
    },
  },
  {
    method: "GET",
    path: /^\/admin\/qr$/,
    handler: () =>
      ok("QR codes loaded", {
        codes: db.admin.qr.map((qr) => ({
          ...qr,
          qrImageUrl: qrImageDataUri(qr.table || qr.label),
        })),
      }),
  },
  {
    method: "POST",
    path: /^\/admin\/qr$/,
    handler: ({ body }) => {
      const qr = {
        id: genId("aqr"),
        restaurant: body.restaurant,
        label: body.label || `Table ${body.table}`,
        table: body.table || "",
        active: true,
        scans: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      db.admin.qr.unshift(qr);
      return ok("QR code generated", { code: qr });
    },
  },
  {
    method: "PATCH",
    path: /^\/admin\/qr\/([^/]+)$/,
    handler: ({ params, body }) => {
      const qr = db.admin.qr.find((q) => q.id === params[0]);
      if (!qr) fail("QR code not found");
      if (typeof body.active === "boolean") qr.active = body.active;
      return ok("QR code updated", { code: qr });
    },
  },
  {
    method: "DELETE",
    path: /^\/admin\/qr\/([^/]+)$/,
    handler: ({ params }) => {
      db.admin.qr = db.admin.qr.filter((q) => q.id !== params[0]);
      return ok("QR code removed", {});
    },
  },
  {
    method: "GET",
    path: /^\/admin\/activity$/,
    handler: () => ok("Activity loaded", { activity: db.admin.activity }),
  },
  {
    method: "GET",
    path: /^\/admin\/settings$/,
    handler: () => ok("Settings loaded", db.admin.settings),
  },
  {
    method: "PATCH",
    path: /^\/admin\/settings$/,
    handler: ({ body }) => {
      db.admin.settings = {
        otp: { ...db.admin.settings.otp, ...(body.otp ?? {}) },
        notifications: { ...db.admin.settings.notifications, ...(body.notifications ?? {}) },
      };
      return ok("Settings saved", db.admin.settings);
    },
  },

  // ---- Manager live monitoring ------------------------------------------
  {
    method: "GET",
    path: /^\/manager\/live-monitoring$/,
    handler: () => ok("Live monitoring loaded", db.managerLiveMonitoring),
  },

  // ---- Manager table management (PRD §16.1) -----------------------------
  {
    method: "GET",
    path: /^\/manager\/tables$/,
    handler: () => {
      const tables = db.restaurantTables.map((table) => {
        const num = table.number.replace(/^T-?/i, "");
        const order = db.orders.find(
          (o) =>
            o.tableNumber === num &&
            !["completed", "cancelled", "rejected"].includes(o.orderStatus) &&
            o.paymentStatus !== "paid",
        );
        return {
          ...table,
          activeOrder: order
            ? {
                id: order.id,
                items: order.items.reduce((sum, i) => sum + i.quantity, 0),
                status: order.orderStatus,
                total: orderTotal(order),
              }
            : null,
        };
      });
      return ok("Tables loaded", { tables });
    },
  },
  {
    method: "POST",
    path: /^\/manager\/tables$/,
    handler: ({ body }) => {
      const raw = String(body.number ?? "").replace(/^T-?/i, "");
      const table = {
        id: genId("tbl"),
        number: `T-${raw.padStart(2, "0")}`,
        seats: Number(body.seats) || 2,
        status: "available",
        waiter: "",
        active: true,
      };
      db.restaurantTables.push(table);
      return ok("Table added", { table });
    },
  },
  {
    method: "PATCH",
    path: /^\/manager\/tables\/([^/]+)$/,
    handler: ({ params, body }) => {
      const table = db.restaurantTables.find((t) => t.id === params[0]);
      if (!table) fail("Table not found");
      if (body.status) table.status = body.status;
      if (typeof body.active === "boolean") {
        table.active = body.active;
        if (!body.active) table.status = "inactive";
        else if (table.status === "inactive") table.status = "available";
      }
      if (body.waiter !== undefined) table.waiter = body.waiter;
      return ok("Table updated", { table });
    },
  },
  {
    method: "DELETE",
    path: /^\/manager\/tables\/([^/]+)$/,
    handler: ({ params }) => {
      db.restaurantTables = db.restaurantTables.filter((t) => t.id !== params[0]);
      return ok("Table removed", {});
    },
  },

  // ---- Chef item-unavailable / kitchen alerts (PRD §10.2 CHEF-06) -------
  {
    method: "POST",
    path: /^\/chef\/item-unavailable$/,
    handler: ({ body }) => {
      if (!body.title) fail("Item title required");
      // Flag the dish unavailable everywhere the customer/owner can see it.
      for (const item of db.customerMenu.items) {
        if (item.name === body.title) item.available = false;
      }
      for (const item of db.menuManagement.currentItems) {
        if (item.name === body.title) item.available = false;
      }
      const alert = {
        id: genId("kal"),
        item: body.title,
        orderId: body.orderId ?? "",
        table: body.table ?? "",
        status: "open",
        time: new Date().toISOString(),
      };
      db.kitchenAlerts.unshift(alert);
      return ok("Item reported unavailable", { alert });
    },
  },
  {
    method: "GET",
    path: /^\/manager\/kitchen-alerts$/,
    handler: () => ok("Kitchen alerts loaded", { alerts: db.kitchenAlerts }),
  },
  {
    method: "PATCH",
    path: /^\/manager\/kitchen-alerts\/([^/]+)$/,
    handler: ({ params, body }) => {
      const alert = db.kitchenAlerts.find((a) => a.id === params[0]);
      if (!alert) fail("Alert not found");
      alert.status = body.status ?? "resolved";
      return ok("Alert updated", { alert });
    },
  },

  // ---- Customer OTP auth (QR app) ---------------------------------------
  {
    method: "POST",
    path: /^\/customer\/otp\/send$/,
    handler: ({ body }) => {
      const mobile = String(body.mobile ?? "");
      if (!/^\d{10}$/.test(mobile)) fail("Enter a valid 10-digit mobile number");
      // Demo OTP is always 1234 — surfaced so the flow works fully offline.
      return ok("OTP sent", { mobile, devOtp: "1234", cooldownSeconds: 30 });
    },
  },
  {
    method: "POST",
    path: /^\/customer\/otp\/verify$/,
    handler: ({ body }) => {
      if (String(body.otp ?? "") !== "1234") fail("Incorrect OTP. Try 1234.");
      const mobile = String(body.mobile ?? "");
      return ok("Mobile verified", {
        token: genId("ctoken"),
        customer: { id: `cust_${mobile.slice(-4)}`, mobile, name: body.name ?? "" },
      });
    },
  },

  // ---- Customer menu / restaurant (QR app) ------------------------------
  {
    method: "GET",
    path: /^\/customer\/menu$/,
    handler: () =>
      ok("Menu loaded", {
        restaurant: db.customerMenu.restaurant,
        categories: db.customerMenu.categories,
        items: db.customerMenu.items,
      }),
  },
  {
    method: "GET",
    path: /^\/customer\/offers$/,
    handler: () => ok("Offers loaded", { offers: db.customerOffers }),
  },

  // ---- Customer assistance requests (PRD §11.3) -------------------------
  {
    method: "POST",
    path: /^\/customer\/requests$/,
    handler: ({ body }) => {
      if (!body.type) fail("Choose a request type");
      const request = {
        id: genId("req"),
        table: body.tableNumber || "",
        type: body.type,
        note: body.note ?? "",
        status: "open",
        mobile: body.mobile ?? "",
        time: new Date().toISOString(),
      };
      db.customerRequests.unshift(request);
      return ok("Request sent to staff", { request });
    },
  },
  {
    method: "GET",
    path: /^\/customer\/requests$/,
    handler: ({ query }) => {
      const mobile = query.mobile;
      const requests = db.customerRequests.filter((r) => !mobile || r.mobile === mobile);
      return ok("Requests loaded", { requests });
    },
  },
  {
    method: "GET",
    path: /^\/staff\/requests$/,
    handler: () => ok("Requests loaded", { requests: db.customerRequests }),
  },
  {
    method: "PATCH",
    path: /^\/staff\/requests\/([^/]+)$/,
    handler: ({ params, body }) => {
      const request = db.customerRequests.find((r) => r.id === params[0]);
      if (!request) fail("Request not found");
      request.status = body.status ?? request.status;
      return ok("Request updated", { request });
    },
  },

  // ---- Customer orders (QR app) -----------------------------------------
  {
    method: "POST",
    path: /^\/customer\/orders$/,
    handler: ({ body }) => {
      const items = (body.items ?? []).map((line) => ({
        recipeId: line.id,
        title: line.name,
        price: Number(line.price) || 0,
        quantity: Number(line.quantity) || 0,
        instructions: line.instructions ?? "",
      }));
      if (items.length === 0) fail("Your cart is empty");
      const order = {
        id: genId("ord"),
        tableNumber: body.tableNumber ?? "",
        orderType: body.orderType ?? "dine-in",
        customerMobile: body.mobile ?? "",
        time: new Date().toISOString(),
        orderStatus: "new",
        paymentStatus: "pending",
        items,
      };
      db.orders.push(order);
      return ok("Order placed", { order });
    },
  },
  {
    method: "GET",
    path: /^\/customer\/orders\/([^/]+)$/,
    handler: ({ params }) => {
      const order = db.orders.find((o) => o.id === params[0]);
      if (!order) fail("Order not found");
      return ok("Order loaded", { order });
    },
  },
  {
    method: "GET",
    path: /^\/customer\/orders$/,
    handler: ({ query }) => {
      const mobile = query.mobile;
      const orders = db.orders
        .filter((o) => !mobile || o.customerMobile === mobile)
        .slice()
        .reverse();
      return ok("Orders loaded", { orders });
    },
  },
];

export async function mockRequestJson(url, options = {}) {
  const method = (options.method ?? "GET").toUpperCase();
  const [path, queryString = ""] = url.split("?");
  const query = Object.fromEntries(new URLSearchParams(queryString));
  const body = options.body ? JSON.parse(options.body) : {};

  await delay(MOCK_LATENCY_MS);

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = route.path.exec(path);
    if (!match) continue;
    return route.handler({ params: match.slice(1), query, body });
  }

  // Surfaces clearly in the console when a screen calls an unmocked endpoint.
  throw new Error(`[mock] No handler for ${method} ${path}`);
}

// Lets you reset the mock dataset programmatically if needed (e.g. a dev button).
export function resetMockDb() {
  db = createSeed();
  idCounter = 0;
}
