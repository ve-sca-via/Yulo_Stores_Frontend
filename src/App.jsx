import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

// Data layer. Screens call requestJson() and never touch fetch directly, so the
// app can run against mock JSON (default) or the real backend via one env flag.
// See src/api/config.js and src/mocks/.
import { requestJson, readToken, storeToken } from "./api";
import OwnerDashboard from "./screens/OwnerDashboard";
import MenuManagement from "./screens/MenuManagement";
import QrManagement from "./screens/QrManagement";
import Offers from "./screens/Offers";
import LiveMonitor from "./screens/LiveMonitor";
import ManageOrders from "./screens/ManageOrders";
import Cancellations from "./screens/Cancellations";
import MenuItems from "./screens/MenuItems";
import StoreSettings from "./screens/StoreSettings";
import BillDetails from "./screens/BillDetails";
import Profile from "./screens/Profile";
import StaffManagement from "./screens/StaffManagement";
import ChefDashboard from "./screens/ChefDashboard";
import ManagerDashboard from "./screens/manager/ManagerDashboard";
import ManagerLiveMonitoring from "./screens/manager/ManagerLiveMonitoring";
import ManagerOrders from "./screens/manager/ManagerOrders";
import ManagerRequests from "./screens/manager/ManagerRequests";
import ManagerTables from "./screens/manager/ManagerTables";
import CustomerApp from "./screens/customer/CustomerApp";
import WaiterApp from "./screens/waiter/WaiterApp";
import AdminApp from "./screens/admin/AdminApp";
import PanelSwitcher from "./components/PanelSwitcher";
import OwnerLoginPage from "./screens/auth/OwnerLoginPage";
import StaffLoginPage from "./screens/auth/StaffLoginPage";
import OwnerRoute from "./components/OwnerRoute";
import StaffRoute from "./components/StaffRoute";

const OWNER_STORAGE_KEY = "yulo_owner_session";
const EMPLOYEE_STORAGE_KEY = "yulo_employee_session";

function readStoredOwner() {
  try {
    const rawValue = window.localStorage.getItem(OWNER_STORAGE_KEY);

    return rawValue ? JSON.parse(rawValue) : null;
  } catch (_error) {
    return null;
  }
}

function storeOwner(owner) {
  if (!owner) {
    window.localStorage.removeItem(OWNER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(owner));
}

function readStoredEmployee() {
  try {
    const rawValue = window.localStorage.getItem(EMPLOYEE_STORAGE_KEY);

    return rawValue ? JSON.parse(rawValue) : null;
  } catch (_error) {
    return null;
  }
}

function storeEmployee(employee) {
  if (!employee) {
    window.localStorage.removeItem(EMPLOYEE_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employee));
}

function normalizeOwner(owner) {
  if (!owner) {
    return null;
  }

  const restaurant = owner.restaurant
    ? typeof owner.restaurant === "string"
      ? { id: owner.restaurant }
      : {
          id: owner.restaurant._id ?? owner.restaurant.id,
          name: owner.restaurant.name,
          owner: owner.restaurant.owner,
          recipies: owner.restaurant.recipies ?? [],
          staffMembers: owner.restaurant.staffMembers ?? [],
        }
    : null;

  return {
    id: owner._id ?? owner.id,
    name: owner.name,
    email: owner.email,
    restaurant,
  };
}

function normalizeEmployeeSession(data) {
  if (!data?.member || !data?.restaurant) {
    return null;
  }

  return {
    member: {
      id: data.member._id ?? data.member.id,
      role: data.member.role,
      name: data.member.name,
      email: data.member.email,
      employeeId: data.member.employeeId,
    },
    restaurant: {
      id: data.restaurant._id ?? data.restaurant.id,
      name: data.restaurant.name,
    },
    portal: data.portal,
  };
}

function normalizeRecipeId(recipeId) {
  if (!recipeId) {
    return "";
  }

  return typeof recipeId === "string"
    ? recipeId
    : recipeId.$oid ?? recipeId.toString?.() ?? String(recipeId);
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function hashString(input) {
  return Array.from(input).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
}

function applyRestaurantTheme(restaurant) {
  const themes = [
    {
      bg: "linear-gradient(135deg, #f7f1e8 0%, #efe3d0 50%, #d7c3a7 100%)",
      surface: "rgba(255, 252, 247, 0.78)",
      surfaceStrong: "#fffaf2",
      text: "#2a2118",
      muted: "#6e5b48",
      accent: "#b85c38",
      accentSoft: "rgba(184, 92, 56, 0.12)",
      border: "rgba(63, 40, 19, 0.1)",
      shadow: "0 24px 70px rgba(62, 35, 10, 0.15)",
    },
    {
      bg: "linear-gradient(135deg, #eef6f2 0%, #d6eadf 55%, #a7ccb9 100%)",
      surface: "rgba(247, 255, 251, 0.8)",
      surfaceStrong: "#f9fffb",
      text: "#10241c",
      muted: "#476457",
      accent: "#1f7a5c",
      accentSoft: "rgba(31, 122, 92, 0.14)",
      border: "rgba(16, 36, 28, 0.1)",
      shadow: "0 24px 70px rgba(20, 73, 56, 0.14)",
    },
    {
      bg: "linear-gradient(135deg, #f4ede7 0%, #ead2be 50%, #cda27e 100%)",
      surface: "rgba(255, 249, 244, 0.78)",
      surfaceStrong: "#fffaf5",
      text: "#2f1c11",
      muted: "#76533d",
      accent: "#c06a2b",
      accentSoft: "rgba(192, 106, 43, 0.14)",
      border: "rgba(47, 28, 17, 0.1)",
      shadow: "0 24px 70px rgba(101, 52, 19, 0.14)",
    },
    {
      bg: "linear-gradient(135deg, #f1f2f8 0%, #d9def0 52%, #a9b4da 100%)",
      surface: "rgba(251, 252, 255, 0.78)",
      surfaceStrong: "#ffffff",
      text: "#182033",
      muted: "#596683",
      accent: "#3454d1",
      accentSoft: "rgba(52, 84, 209, 0.12)",
      border: "rgba(24, 32, 51, 0.1)",
      shadow: "0 24px 70px rgba(37, 59, 141, 0.15)",
    },
  ];

  const key = `${restaurant?.id ?? ""}${restaurant?.name ?? ""}`;
  const theme = themes[hashString(key) % themes.length];
  const root = document.documentElement;

  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-strong", theme.surfaceStrong);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-soft", theme.accentSoft);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--shadow", theme.shadow);
}

function AppShell({ children }) {
  const location = useLocation();
  const isOwnerPortal = location.pathname.startsWith("/owner");
  const isChefPortal = location.pathname.startsWith("/chef");
  const isWaiterPortal = location.pathname.startsWith("/waiter");
  const homeTarget = isOwnerPortal
    ? "/owner"
    : isChefPortal
      ? "/chef"
      : isWaiterPortal
        ? "/waiter"
        : "/menu";

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to={homeTarget}>
          Yulo Stores
        </Link>
        <nav className="topnav">
          <Link to="/owner">Owner Portal</Link>
          <Link to="/chef">Chef Portal</Link>
          <Link to="/waiter">Waiter Portal</Link>
          <Link to="/menu">QR Menu</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

function AuthCard({
  mode,
  form,
  onChange,
  onModeChange,
  onSubmit,
  loading,
  status,
}) {
  return (
    <section className="panel auth-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Restaurant Owner</p>
          <h1>
            {mode === "login"
              ? "Sign in to manage your restaurant"
              : "Create your owner account"}
          </h1>
        </div>
        <p className="status-text">{status}</p>
      </div>

      <div className="segmented-control">
        <button
          className={mode === "login" ? "active" : ""}
          type="button"
          onClick={() => onModeChange("login")}
        >
          Login
        </button>
        <button
          className={mode === "signup" ? "active" : ""}
          type="button"
          onClick={() => onModeChange("signup")}
        >
          Signup
        </button>
      </div>

      <form className="stack-form" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <label>
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Owner name"
              required
            />
          </label>
        ) : null}
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="owner@restaurant.com"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Enter password"
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading
            ? "Submitting..."
            : mode === "login"
              ? "Login"
              : "Create Account"}
        </button>
      </form>
    </section>
  );
}

function EmployeePortalLoginCard({
  role,
  form,
  onChange,
  onSubmit,
  loading,
  status,
}) {
  const title = role === "chef" ? "Chef Portal" : "Waiter Portal";

  return (
    <main className="page-shell owner-shell">
      <section className="panel auth-panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">{title}</p>
            <h1>Employee login</h1>
          </div>
          <p className="status-text">{status}</p>
        </div>

        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            <span>Employee ID</span>
            <input
              name="employeeId"
              value={form.employeeId}
              onChange={onChange}
              placeholder={`${role}01`}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="Enter password"
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

function OwnerPortalPage() {
  const [owner, setOwner] = useState(() => readStoredOwner());
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authStatus, setAuthStatus] = useState("Login or signup to continue");
  const [authLoading, setAuthLoading] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
  });
  const [chefMemberForm, setChefMemberForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    password: "",
  });
  const [waiterMemberForm, setWaiterMemberForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    password: "",
  });
  const [itemForm, setItemForm] = useState({
    title: "",
    ingredients: "",
    price: "",
  });
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [menuEditForm, setMenuEditForm] = useState({
    title: "",
    ingredients: "",
    price: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    tags: "",
    note: "",
  });
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [inventoryEditForm, setInventoryEditForm] = useState({
    name: "",
    quantity: "",
    unit: "kg",
    price: "",
    available: true,
  });
  const [qrForm, setQrForm] = useState({
    tableNumber: "",
    baseUrl: typeof window !== "undefined" ? window.location.origin : "",
  });
  const [menuItems, setMenuItems] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [ordersData, setOrdersData] = useState({ totalOrders: 0, orders: [] });
  const [analyticsData, setAnalyticsData] = useState({
    summary: null,
    unavailableItems: [],
    lowStockItems: [],
    recentMovements: [],
    recentExpenses: [],
    expenseBreakdown: [],
  });
  const [movementForms, setMovementForms] = useState({});
  const [portalStatus, setPortalStatus] = useState("Waiting for owner actions");
  const [qrData, setQrData] = useState(null);

  async function refreshRestaurantMenu(restaurantId) {
    if (!restaurantId) {
      return;
    }

    const payload = await requestJson(`/api/restaurants/${restaurantId}/menu`);
    setMenuItems(payload.data.restaurant.recipies ?? []);
  }

  async function refreshOrders(restaurantId) {
    if (!restaurantId) {
      return;
    }

    const payload = await requestJson(
      `/restaurant_owner/orders?restaurant_id=${restaurantId}`,
    );
    setOrdersData({
      totalOrders: payload.data.totalOrders,
      orders: payload.data.orders,
    });
  }

  async function refreshInventory(restaurantId) {
    if (!restaurantId) {
      return;
    }

    const payload = await requestJson(
      `/restaurant_owner/inventory?restaurant_id=${restaurantId}`,
    );
    setInventoryItems(payload.data.inventory ?? []);
  }

  async function refreshExpenses(restaurantId) {
    if (!restaurantId) {
      return;
    }

    const payload = await requestJson(
      `/restaurant_owner/expenses?restaurant_id=${restaurantId}`,
    );
    setExpenseItems(payload.data.expenses ?? []);
  }

  async function refreshAnalytics(restaurantId) {
    if (!restaurantId) {
      return;
    }

    const payload = await requestJson(
      `/restaurant_owner/analytics?restaurant_id=${restaurantId}`,
    );
    setAnalyticsData(payload.data);
  }

  useEffect(() => {
    storeOwner(owner);
  }, [owner]);

  useEffect(() => {
    if (!owner?.restaurant?.id) {
      return;
    }

    setProfileForm({
      name: owner.name ?? "",
      email: owner.email ?? "",
      password: "",
    });
    setRestaurantForm({
      name: owner.restaurant?.name ?? "",
    });

    refreshRestaurantMenu(owner.restaurant.id).catch((error) =>
      setPortalStatus(error.message),
    );
    refreshInventory(owner.restaurant.id).catch((error) =>
      setPortalStatus(error.message),
    );
    refreshExpenses(owner.restaurant.id).catch((error) =>
      setPortalStatus(error.message),
    );
    refreshAnalytics(owner.restaurant.id).catch((error) =>
      setPortalStatus(error.message),
    );
    refreshOrders(owner.restaurant.id).catch((error) =>
      setPortalStatus(error.message),
    );
  }, [owner?.restaurant?.id]);

  useEffect(() => {
    if (!owner?.restaurant?.id) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      refreshOrders(owner.restaurant.id).catch(() => {});
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [owner?.restaurant?.id]);

  function handleAuthInputChange(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "login"
          ? "/restaurant_owner/login"
          : "/restaurant_owner/signup";
      const payload = await requestJson(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authForm),
      });

      storeToken(payload.data.token);
      const nextOwner = normalizeOwner(payload.data.owner);
      setOwner(nextOwner);
      setAuthStatus(payload.message);
      setPortalStatus("Owner authenticated successfully");
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthStatus(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRestaurantRegister(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        "/restaurant_owner/register_restaurant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: owner.id,
            name: restaurantName,
          }),
        },
      );

      setOwner((current) => ({
        ...current,
        restaurant: payload.data.restaurant,
      }));
      setRestaurantName("");
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleProfileUpdate(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson(`/restaurant_owner/profile/${owner.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      setOwner(normalizeOwner(payload.data.owner));
      setProfileForm((current) => ({ ...current, password: "" }));
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleRestaurantUpdate(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson("/restaurant_owner/restaurant", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
          name: restaurantForm.name,
        }),
      });

      setOwner((current) => ({
        ...current,
        restaurant: {
          ...current.restaurant,
          ...payload.data.restaurant,
        },
      }));
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleAddStaffMember(role) {
    if (!owner?.id) {
      return;
    }

    const form = role === "chef" ? chefMemberForm : waiterMemberForm;

    try {
      const payload = await requestJson("/restaurant_owner/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
          role,
          name: form.name,
          email: form.email,
          employeeId: form.employeeId,
          password: form.password,
        }),
      });

      setOwner((current) => ({
        ...current,
        restaurant: {
          ...current.restaurant,
          ...payload.data.restaurant,
        },
      }));

      if (role === "chef") {
        setChefMemberForm({
          name: "",
          email: "",
          employeeId: "",
          password: "",
        });
      } else {
        setWaiterMemberForm({
          name: "",
          email: "",
          employeeId: "",
          password: "",
        });
      }

      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleDeleteStaffMember(memberId) {
    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        `/restaurant_owner/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: owner.id,
          }),
        },
      );

      setOwner((current) => ({
        ...current,
        restaurant: {
          ...current.restaurant,
          ...payload.data.restaurant,
        },
      }));
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleAddItem(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson("/restaurant_owner/add_item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
          title: itemForm.title,
          ingredients: itemForm.ingredients
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          price: Number(itemForm.price),
        }),
      });

      setPortalStatus(payload.message);
      setItemForm({ title: "", ingredients: "", price: "" });
      await refreshRestaurantMenu(payload.data.restaurantId);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  function beginMenuItemEdit(item) {
    setEditingMenuItemId(item.id);
    setMenuEditForm({
      title: item.title,
      ingredients: (item.ingredients ?? []).join(", "),
      price: item.price.toString(),
    });
  }

  function cancelMenuItemEdit() {
    setEditingMenuItemId(null);
    setMenuEditForm({
      title: "",
      ingredients: "",
      price: "",
    });
  }

  async function handleSaveMenuItemEdit(itemId) {
    if (!owner?.id || !owner?.restaurant?.id) {
      return;
    }

    try {
      const payload = await requestJson(`/restaurant_owner/menu/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
          title: menuEditForm.title,
          ingredients: menuEditForm.ingredients
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          price: Number(menuEditForm.price),
        }),
      });

      await refreshRestaurantMenu(payload.data.restaurantId);
      cancelMenuItemEdit();
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleDeleteMenuItem(itemId) {
    if (!owner?.id || !owner?.restaurant?.id) {
      return;
    }

    try {
      const payload = await requestJson(`/restaurant_owner/menu/${itemId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
        }),
      });

      await refreshRestaurantMenu(payload.data.restaurantId);
      if (editingMenuItemId === itemId) {
        cancelMenuItemEdit();
      }
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleGenerateQr(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson("/restaurant_owner/generate_qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
          tableNumber: qrForm.tableNumber,
          baseUrl: qrForm.baseUrl,
        }),
      });

      setQrData(payload.data);
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleAddExpense(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson("/restaurant_owner/add_expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
          title: expenseForm.title,
          amount: Number(expenseForm.amount),
          tags: expenseForm.tags
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          note: expenseForm.note,
        }),
      });

      setExpenseForm({
        title: "",
        amount: "",
        tags: "",
        note: "",
      });
      setPortalStatus(payload.message);
      await refreshExpenses(payload.data.restaurantId);
      await refreshAnalytics(payload.data.restaurantId);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleDeleteExpense(expenseId) {
    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        `/restaurant_owner/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: owner.id,
          }),
        },
      );

      await refreshExpenses(payload.data.restaurantId);
      await refreshAnalytics(payload.data.restaurantId);
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleRefreshOrders() {
    if (!owner?.restaurant?.id) {
      return;
    }

    try {
      await refreshOrders(owner.restaurant.id);
      setPortalStatus("Orders refreshed");
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  function beginInventoryEdit(item) {
    setEditingInventoryId(item.id);
    setInventoryEditForm({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit || "kg",
      price: item.price.toString(),
      available: item.available !== false,
    });
  }

  function cancelInventoryEdit() {
    setEditingInventoryId(null);
    setInventoryEditForm({
      name: "",
      quantity: "",
      unit: "kg",
      price: "",
      available: true,
    });
  }

  async function handleSaveInventoryEdit(inventoryId) {
    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        `/restaurant_owner/inventory/${inventoryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: owner.id,
            name: inventoryEditForm.name,
            quantity: Number(inventoryEditForm.quantity),
            unit: inventoryEditForm.unit,
            price: Number(inventoryEditForm.price),
            available: inventoryEditForm.available,
          }),
        },
      );

      await refreshInventory(payload.data.restaurantId);
      setPortalStatus(payload.message);
      cancelInventoryEdit();
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleDeleteInventory(inventoryId) {
    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        `/restaurant_owner/inventory/${inventoryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: owner.id,
          }),
        },
      );

      await refreshInventory(payload.data.restaurantId);
      setPortalStatus(payload.message);

      if (editingInventoryId === inventoryId) {
        cancelInventoryEdit();
      }
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  function updateMovementForm(itemId, nextValue) {
    setMovementForms((current) => ({
      ...current,
      [itemId]: {
        type: current[itemId]?.type ?? "restock",
        quantity: current[itemId]?.quantity ?? "",
        note: current[itemId]?.note ?? "",
        ...nextValue,
      },
    }));
  }

  async function handleInventoryMovement(item) {
    if (!owner?.id) {
      return;
    }

    const movementForm = movementForms[item.id] ?? {
      type: "restock",
      quantity: "",
      note: "",
    };

    try {
      const payload = await requestJson(
        `/restaurant_owner/inventory/${item.id}/movements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: owner.id,
            type: movementForm.type,
            quantity: Number(movementForm.quantity),
            note: movementForm.note,
          }),
        },
      );

      await refreshInventory(payload.data.restaurantId);
      await refreshAnalytics(payload.data.restaurantId);
      setMovementForms((current) => ({
        ...current,
        [item.id]: {
          type: "restock",
          quantity: "",
          note: "",
        },
      }));
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleToggleInventoryAvailability(item) {
    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        `/restaurant_owner/inventory/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: owner.id,
            name: item.name,
            quantity: Number(item.quantity),
            unit: item.unit || "kg",
            price: Number(item.price),
            available: item.available === false,
          }),
        },
      );

      await refreshInventory(payload.data.restaurantId);
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleMarkOrderPaid(orderId) {
    if (!owner?.restaurant?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        `/restaurant_owner/orders/${orderId}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantId: owner.restaurant.id,
            paymentStatus: "paid",
          }),
        },
      );

      setOrdersData((current) => ({
        ...current,
        orders: current.orders.map((order) =>
          order.id === orderId
            ? { ...order, paymentStatus: "paid" }
            : order,
        ),
      }));
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleGenerateBill(order) {
    if (!owner?.restaurant?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        `/restaurant_owner/orders/${order.id}/bill?restaurant_id=${owner.restaurant.id}`,
      );
      const bill = payload.data.bill;
      const billWindow = window.open("", "_blank", "width=820,height=900");

      if (!billWindow) {
        setPortalStatus("Enable popups to view the generated bill");
        return;
      }

      const itemRows = bill.items
        .map(
          (item) => `
            <tr>
              <td>${item.title}</td>
              <td>${item.quantity}</td>
              <td>${formatPrice(item.price)}</td>
              <td>${formatPrice(item.lineTotal)}</td>
            </tr>
          `,
        )
        .join("");

      billWindow.document.write(`
        <html>
          <head>
            <title>${bill.billNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
              h1, h2, p { margin: 0 0 8px; }
              .meta { margin-bottom: 24px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
              th { background: #f3f4f6; }
              .total { margin-top: 20px; text-align: right; font-size: 18px; font-weight: 700; }
            </style>
          </head>
          <body>
            <h1>${bill.restaurant.name}</h1>
            <div class="meta">
              <p><strong>Bill No:</strong> ${bill.billNumber}</p>
              <p><strong>Order:</strong> ${bill.order.id.slice(-6)}</p>
              <p><strong>Table:</strong> ${bill.order.tableNumber || "N/A"}</p>
              <p><strong>Generated:</strong> ${new Date(bill.generatedAt).toLocaleString("en-IN")}</p>
              <p><strong>Payment:</strong> ${bill.order.paymentStatus}</p>
              <p><strong>Status:</strong> ${bill.order.orderStatus}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <p class="total">Grand Total: ${formatPrice(bill.total)}</p>
          </body>
        </html>
      `);
      billWindow.document.close();
      billWindow.focus();
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleLogout() {
    try {
      await requestJson("/restaurant_owner/logout", {
        method: "POST",
      });
    } catch (_error) {
      // Local logout still applies if backend session clear fails.
    } finally {
      storeToken(null);
      setOwner(null);
      setMenuItems([]);
      setExpenseItems([]);
      setInventoryItems([]);
      setMovementForms({});
      setAnalyticsData({
        summary: null,
        unavailableItems: [],
        lowStockItems: [],
        recentMovements: [],
        recentExpenses: [],
        expenseBreakdown: [],
      });
      cancelInventoryEdit();
      cancelMenuItemEdit();
      setOrdersData({ totalOrders: 0, orders: [] });
      setQrData(null);
      setPortalStatus("Logged out");
    }
  }

  if (!owner) {
    return (
      <main className="page-shell owner-shell">
        <AuthCard
          mode={authMode}
          form={authForm}
          onChange={handleAuthInputChange}
          onModeChange={setAuthMode}
          onSubmit={handleAuthSubmit}
          loading={authLoading}
          status={authStatus}
        />
      </main>
    );
  }

  const staffMembers = owner.restaurant?.staffMembers ?? [];
  const chefMembers = staffMembers.filter((member) => member.role === "chef");
  const waiterMembers = staffMembers.filter((member) => member.role === "waiter");

  return (
    <main className="page-shell owner-shell">
      <section className="hero-card owner-hero">
        <div>
          <p className="section-label">Owner Dashboard</p>
          <h1>{owner.name}</h1>
          <p className="hero-text">
            {owner.email}
            {owner.restaurant?.name
              ? ` • ${owner.restaurant.name}`
              : " • No restaurant registered yet"}
          </p>
        </div>
        <div className="hero-actions">
          <span className="badge ghost">{portalStatus}</span>
          <button
            className="secondary-button"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </section>

      {!owner.restaurant?.id ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Restaurant Setup</p>
              <h2>Register your restaurant</h2>
            </div>
          </div>
          <form className="stack-form" onSubmit={handleRestaurantRegister}>
            <label>
              <span>Restaurant name</span>
              <input
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
                placeholder="Enter restaurant name"
                required
              />
            </label>
            <button className="primary-button" type="submit">
              Register Restaurant
            </button>
          </form>
        </section>
      ) : (
        <section className="owner-grid">
          <section className="owner-metrics">
            <article className="mini-panel metric-card">
              <span className="metric-label">Menu items</span>
              <strong>{menuItems.length}</strong>
              <p>Active dishes available for ordering.</p>
            </article>
            <article className="mini-panel metric-card">
              <span className="metric-label">Stock lines</span>
              <strong>{inventoryItems.length}</strong>
              <p>Tracked inventory entries for the kitchen.</p>
            </article>
            <article className="mini-panel metric-card">
              <span className="metric-label">Orders</span>
              <strong>{ordersData.totalOrders}</strong>
              <p>All orders recorded for this restaurant.</p>
            </article>
            <article className="mini-panel metric-card">
              <span className="metric-label">Status</span>
              <strong>{qrData ? "QR ready" : "Operational"}</strong>
              <p>{portalStatus}</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Owner Settings</p>
                <h2>Profile and restaurant</h2>
                <p className="panel-note">
                  Update your owner identity and restaurant display name.
                </p>
              </div>
            </div>

            <div className="settings-grid">
              <form className="stack-form compact-form" onSubmit={handleProfileUpdate}>
                <label>
                  <span>Owner name</span>
                  <input
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  <span>New password</span>
                  <input
                    type="password"
                    value={profileForm.password}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Leave blank to keep existing"
                  />
                </label>
                <div className="form-actions">
                  <button className="primary-button" type="submit">
                    Save Profile
                  </button>
                </div>
              </form>

              <form className="stack-form compact-form" onSubmit={handleRestaurantUpdate}>
                <label>
                  <span>Restaurant name</span>
                  <input
                    value={restaurantForm.name}
                    onChange={(event) =>
                      setRestaurantForm({
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <div className="form-actions">
                  <button className="primary-button" type="submit">
                    Update Restaurant
                  </button>
                </div>
              </form>

              <div className="stack-form compact-form">
                <div>
                  <p className="section-label">Chef Members</p>
                  <h3>Add chef</h3>
                  <p className="panel-note">
                    Add kitchen staff members for this restaurant.
                  </p>
                </div>
                <label>
                  <span>Chef name</span>
                  <input
                    value={chefMemberForm.name}
                    onChange={(event) =>
                      setChefMemberForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Enter chef name"
                  />
                </label>
                <label>
                  <span>Chef email</span>
                  <input
                    type="email"
                    value={chefMemberForm.email}
                    onChange={(event) =>
                      setChefMemberForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="chef@restaurant.com"
                  />
                </label>
                <label>
                  <span>Chef employee ID</span>
                  <input
                    value={chefMemberForm.employeeId}
                    onChange={(event) =>
                      setChefMemberForm((current) => ({
                        ...current,
                        employeeId: event.target.value,
                      }))
                    }
                    placeholder="chef01"
                    required
                  />
                </label>
                <label>
                  <span>Chef password</span>
                  <input
                    type="password"
                    value={chefMemberForm.password}
                    onChange={(event) =>
                      setChefMemberForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Set login password"
                    required
                  />
                </label>
                <div className="form-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => handleAddStaffMember("chef")}
                    disabled={
                      !chefMemberForm.employeeId || !chefMemberForm.password
                    }
                  >
                    Add Chef
                  </button>
                </div>
                <div className="owner-list compact-list">
                  {chefMembers.length === 0 ? (
                    <p className="empty-state">No chefs added yet.</p>
                  ) : (
                    chefMembers.map((member) => (
                      <article className="owner-list-item" key={member.id}>
                        <div>
                          <h3>{member.name}</h3>
                          <p>{member.email}</p>
                          <p>ID: {member.employeeId || "Not set"}</p>
                        </div>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => handleDeleteStaffMember(member.id)}
                        >
                          Remove
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="stack-form compact-form">
                <div>
                  <p className="section-label">Waiter Members</p>
                  <h3>Add waiter</h3>
                  <p className="panel-note">
                    Add service staff members for table ordering.
                  </p>
                </div>
                <label>
                  <span>Waiter name</span>
                  <input
                    value={waiterMemberForm.name}
                    onChange={(event) =>
                      setWaiterMemberForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Enter waiter name"
                  />
                </label>
                <label>
                  <span>Waiter email</span>
                  <input
                    type="email"
                    value={waiterMemberForm.email}
                    onChange={(event) =>
                      setWaiterMemberForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="waiter@restaurant.com"
                  />
                </label>
                <label>
                  <span>Waiter employee ID</span>
                  <input
                    value={waiterMemberForm.employeeId}
                    onChange={(event) =>
                      setWaiterMemberForm((current) => ({
                        ...current,
                        employeeId: event.target.value,
                      }))
                    }
                    placeholder="waiter01"
                    required
                  />
                </label>
                <label>
                  <span>Waiter password</span>
                  <input
                    type="password"
                    value={waiterMemberForm.password}
                    onChange={(event) =>
                      setWaiterMemberForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Set login password"
                    required
                  />
                </label>
                <div className="form-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => handleAddStaffMember("waiter")}
                    disabled={
                      !waiterMemberForm.employeeId || !waiterMemberForm.password
                    }
                  >
                    Add Waiter
                  </button>
                </div>
                <div className="owner-list compact-list">
                  {waiterMembers.length === 0 ? (
                    <p className="empty-state">No waiters added yet.</p>
                  ) : (
                    waiterMembers.map((member) => (
                      <article className="owner-list-item" key={member.id}>
                        <div>
                          <h3>{member.name}</h3>
                          <p>{member.email}</p>
                          <p>ID: {member.employeeId || "Not set"}</p>
                        </div>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => handleDeleteStaffMember(member.id)}
                        >
                          Remove
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Analytics</p>
                <h2>Cost and selling snapshot</h2>
                <p className="panel-note">
                  Monitor revenue, stock value, expense outflow, and current margin.
                </p>
              </div>
            </div>

            <div className="analytics-grid">
              <article className="mini-panel analytics-card">
                <span className="metric-label">Revenue</span>
                <strong>
                  {formatPrice(analyticsData.summary?.totalRevenue ?? 0)}
                </strong>
                <p>{analyticsData.summary?.totalPaidOrders ?? 0} paid orders</p>
              </article>
              <article className="mini-panel analytics-card">
                <span className="metric-label">Inventory Cost</span>
                <strong>
                  {formatPrice(analyticsData.summary?.inventoryCost ?? 0)}
                </strong>
                <p>Current stock carrying value.</p>
              </article>
              <article className="mini-panel analytics-card">
                <span className="metric-label">Gross Margin</span>
                <strong>
                  {formatPrice(analyticsData.summary?.estimatedGrossMargin ?? 0)}
                </strong>
                <p>Revenue minus current inventory cost.</p>
              </article>
              <article className="mini-panel analytics-card">
                <span className="metric-label">Expenses</span>
                <strong>
                  {formatPrice(analyticsData.summary?.totalExpenses ?? 0)}
                </strong>
                <p>Manual expenses tagged by the restaurant owner.</p>
              </article>
              <article className="mini-panel analytics-card">
                <span className="metric-label">Net Estimate</span>
                <strong>
                  {formatPrice(
                    analyticsData.summary?.estimatedNetAfterExpenses ?? 0,
                  )}
                </strong>
                <p>Revenue minus inventory cost and expenses.</p>
              </article>
              <article className="mini-panel analytics-card">
                <span className="metric-label">Avg Menu Price</span>
                <strong>
                  {formatPrice(analyticsData.summary?.averageMenuPrice ?? 0)}
                </strong>
                <p>Selling benchmark across listed dishes.</p>
              </article>
            </div>

            <div className="analytics-columns">
              <div className="mini-panel analytics-list-card">
                <div className="panel-heading">
                  <h3>Low stock</h3>
                  <span className="panel-count">
                    {analyticsData.lowStockItems.length}
                  </span>
                </div>
                <div className="owner-list compact-list">
                  {analyticsData.lowStockItems.length === 0 ? (
                    <p className="empty-state">No low stock items.</p>
                  ) : (
                    analyticsData.lowStockItems.map((item) => (
                      <article className="owner-list-item compact-card" key={item.id}>
                        <div className="card-copy">
                          <h3>{item.name}</h3>
                        </div>
                        <strong className="stock-chip">
                          {item.quantity} {item.unit}
                        </strong>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="mini-panel analytics-list-card">
                <div className="panel-heading">
                  <h3>Unavailable stock</h3>
                  <span className="panel-count">
                    {analyticsData.unavailableItems.length}
                  </span>
                </div>
                <div className="owner-list compact-list">
                  {analyticsData.unavailableItems.length === 0 ? (
                    <p className="empty-state">All tracked items are available.</p>
                  ) : (
                    analyticsData.unavailableItems.map((item) => (
                      <article className="owner-list-item compact-card" key={item.id}>
                        <div className="card-copy">
                          <h3>{item.name}</h3>
                        </div>
                        <strong className="stock-chip">
                          {item.quantity} {item.unit}
                        </strong>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="analytics-columns">
              <div className="mini-panel analytics-list-card">
                <div className="panel-heading">
                  <h3>Recent inventory movement</h3>
                </div>
                <div className="owner-list compact-list">
                  {analyticsData.recentMovements.length === 0 ? (
                    <p className="empty-state">No stock movement recorded yet.</p>
                  ) : (
                    analyticsData.recentMovements.map((movement) => (
                      <article className="owner-list-item compact-card" key={movement.id}>
                        <div className="card-copy">
                          <h3>{movement.inventoryName}</h3>
                          <p className="card-meta">
                            {movement.type} •{" "}
                            {new Date(movement.createdAt).toLocaleString("en-IN")}
                            {movement.note ? ` • ${movement.note}` : ""}
                          </p>
                        </div>
                        <strong className="stock-chip">
                          {movement.quantityChange > 0 ? "+" : ""}
                          {movement.quantityChange} {movement.unit}
                        </strong>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="mini-panel analytics-list-card">
                <div className="panel-heading">
                  <h3>Expense by tag</h3>
                  <span className="panel-count">
                    {analyticsData.expenseBreakdown.length}
                  </span>
                </div>
                <div className="owner-list compact-list">
                  {analyticsData.expenseBreakdown.length === 0 ? (
                    <p className="empty-state">No expense tags added yet.</p>
                  ) : (
                    analyticsData.expenseBreakdown.map((entry) => (
                      <article className="owner-list-item compact-card" key={entry.tag}>
                        <div className="card-copy">
                          <h3>{entry.tag}</h3>
                        </div>
                        <strong className="price-chip">
                          {formatPrice(entry.amount)}
                        </strong>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Menu Items</p>
                <h2>Add a dish</h2>
                <p className="panel-note">
                  Build a clean menu with pricing and ingredients.
                </p>
              </div>
              <p className="status-text panel-count">{menuItems.length} listed</p>
            </div>

            <form className="stack-form compact-form" onSubmit={handleAddItem}>
              <label>
                <span>Dish title</span>
                <input
                  value={itemForm.title}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Paneer Tikka"
                  required
                />
              </label>
              <label>
                <span>Ingredients</span>
                <input
                  value={itemForm.ingredients}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      ingredients: event.target.value,
                    }))
                  }
                  placeholder="Paneer, Spices"
                />
              </label>
              <label>
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  value={itemForm.price}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  placeholder="250"
                  required
                />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  Add Item
                </button>
              </div>
            </form>

            <div className="owner-list compact-list">
              {menuItems.length === 0 ? (
                <p className="empty-state">No menu items added yet.</p>
              ) : (
                menuItems.map((item) => (
                  <article className="owner-list-item compact-card" key={item.id}>
                    {editingMenuItemId === item.id ? (
                      <div className="inventory-editor">
                        <label>
                          <span>Dish title</span>
                          <input
                            value={menuEditForm.title}
                            onChange={(event) =>
                              setMenuEditForm((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Ingredients</span>
                          <input
                            value={menuEditForm.ingredients}
                            onChange={(event) =>
                              setMenuEditForm((current) => ({
                                ...current,
                                ingredients: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Price</span>
                          <input
                            type="number"
                            min="0"
                            value={menuEditForm.price}
                            onChange={(event) =>
                              setMenuEditForm((current) => ({
                                ...current,
                                price: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <div className="inventory-actions">
                          <button
                            className="primary-button"
                            type="button"
                            onClick={() => handleSaveMenuItemEdit(item.id)}
                          >
                            Save
                          </button>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={cancelMenuItemEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="card-copy">
                          <h3>{item.title}</h3>
                          <p className="card-meta">
                            {item.ingredients?.join(" • ") ||
                              "Ingredients will be updated soon"}
                          </p>
                        </div>
                        <div className="inventory-card-side">
                          <strong className="price-chip">
                            {formatPrice(item.price)}
                          </strong>
                          <div className="inventory-actions">
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => beginMenuItemEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="secondary-button danger-button"
                              type="button"
                              onClick={() => handleDeleteMenuItem(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">QR Generator</p>
                <h2>Create table link</h2>
                <p className="panel-note">
                  Generate a table QR and open the guest menu directly.
                </p>
              </div>
            </div>

            <form className="stack-form compact-form" onSubmit={handleGenerateQr}>
              <label>
                <span>Table number</span>
                <input
                  value={qrForm.tableNumber}
                  onChange={(event) =>
                    setQrForm((current) => ({
                      ...current,
                      tableNumber: event.target.value,
                    }))
                  }
                  placeholder="4"
                  required
                />
              </label>
              <label>
                <span>Base URL</span>
                <input
                  value={qrForm.baseUrl}
                  onChange={(event) =>
                    setQrForm((current) => ({
                      ...current,
                      baseUrl: event.target.value,
                    }))
                  }
                  placeholder="http://localhost:3000"
                  required
                />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  Generate QR
                </button>
              </div>
            </form>

            {qrData ? (
              <div className="qr-result qr-card">
                <img
                  src={qrData.qrImageUrl}
                  alt={`QR code for table ${qrData.tableNumber}`}
                />
                <div className="qr-copy">
                  <span className="metric-label">Table {qrData.tableNumber}</span>
                  <a href={qrData.link} target="_blank" rel="noreferrer">
                    {qrData.link}
                  </a>
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Expenses</p>
                <h2>Add expense</h2>
                <p className="panel-note">
                  Record operating costs with tags for rent, grocery, salary, and more.
                </p>
              </div>
              <p className="status-text panel-count">
                {expenseItems.length} logged
              </p>
            </div>

            <form className="stack-form compact-form" onSubmit={handleAddExpense}>
              <label>
                <span>Expense title</span>
                <input
                  value={expenseForm.title}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Milk purchase"
                  required
                />
              </label>
              <label>
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="1200"
                  required
                />
              </label>
              <label>
                <span>Tags</span>
                <input
                  value={expenseForm.tags}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      tags: event.target.value,
                    }))
                  }
                  placeholder="grocery, dairy"
                />
              </label>
              <label>
                <span>Note</span>
                <input
                  value={expenseForm.note}
                  onChange={(event) =>
                    setExpenseForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Morning stock refill"
                />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  Add Expense
                </button>
              </div>
            </form>

            <div className="owner-list compact-list">
              {expenseItems.length === 0 ? (
                <p className="empty-state">No expenses added yet.</p>
              ) : (
                expenseItems.map((expense) => (
                  <article className="owner-list-item compact-card" key={expense.id}>
                    <div className="card-copy">
                      <h3>{expense.title}</h3>
                      <p className="card-meta">
                        {new Date(
                          expense.time ?? expense.createdAt ?? Date.now(),
                        ).toLocaleString("en-IN")}
                        {expense.note ? ` • ${expense.note}` : ""}
                      </p>
                      <div className="tag-row">
                        {(expense.tags ?? []).length === 0 ? (
                          <span className="tag-pill muted-tag">untagged</span>
                        ) : (
                          (expense.tags ?? []).map((tag) => (
                            <span className="tag-pill" key={`${expense.id}-${tag}`}>
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="inventory-card-side">
                      <strong className="price-chip expense-amount">
                        {formatPrice(expense.amount)}
                      </strong>
                      <div className="inventory-actions">
                        <button
                          className="secondary-button danger-button"
                          type="button"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Inventory</p>
                <h2>Kitchen stock</h2>
                <p className="panel-note">
                  Review stock, edit quantities, control availability, and log movements.
                </p>
              </div>
              <p className="status-text panel-count">
                {inventoryItems.length} in stock list
              </p>
            </div>

            <div className="owner-list compact-list">
              {inventoryItems.length === 0 ? (
                <p className="empty-state">No inventory items added yet.</p>
              ) : (
                inventoryItems.map((item) => (
                  <article className="owner-list-item compact-card" key={item.id}>
                    {editingInventoryId === item.id ? (
                      <div className="inventory-editor">
                        <label>
                          <span>Name</span>
                          <input
                            value={inventoryEditForm.name}
                            onChange={(event) =>
                              setInventoryEditForm((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Quantity</span>
                          <input
                            type="number"
                            min="0"
                            value={inventoryEditForm.quantity}
                            onChange={(event) =>
                              setInventoryEditForm((current) => ({
                                ...current,
                                quantity: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Unit</span>
                          <input
                            value={inventoryEditForm.unit}
                            onChange={(event) =>
                              setInventoryEditForm((current) => ({
                                ...current,
                                unit: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span>Cost price</span>
                          <input
                            type="number"
                            min="0"
                            value={inventoryEditForm.price}
                            onChange={(event) =>
                              setInventoryEditForm((current) => ({
                                ...current,
                                price: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="toggle-row">
                          <span>Availability</span>
                          <button
                            className={`toggle-button ${
                              inventoryEditForm.available ? "toggle-on" : ""
                            }`}
                            type="button"
                            onClick={() =>
                              setInventoryEditForm((current) => ({
                                ...current,
                                available: !current.available,
                              }))
                            }
                          >
                            <span className="toggle-knob" />
                            <span>
                              {inventoryEditForm.available
                                ? "Available"
                                : "Not available"}
                            </span>
                          </button>
                        </label>
                        <div className="inventory-actions">
                          <button
                            className="primary-button"
                            type="button"
                            onClick={() => handleSaveInventoryEdit(item.id)}
                          >
                            Save
                          </button>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={cancelInventoryEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="card-copy">
                          <h3>{item.name}</h3>
                          <p className="card-meta">Current stock available</p>
                        </div>
                        <div className="inventory-card-side">
                          <strong className="stock-chip">
                            {item.quantity} {item.unit}
                          </strong>
                          <strong className="price-chip">
                            Cost {formatPrice(item.price)}
                          </strong>
                          <span
                            className={`availability-pill ${
                              item.available !== false
                                ? "availability-on"
                                : "availability-off"
                            }`}
                          >
                            {item.available !== false
                              ? "Available"
                              : "Not available"}
                          </span>
                          <div className="inventory-actions">
                            <button
                              className={`secondary-button toggle-inline-button ${
                                item.available !== false ? "toggle-inline-on" : ""
                              }`}
                              type="button"
                              onClick={() => handleToggleInventoryAvailability(item)}
                            >
                              {item.available !== false
                                ? "Set Not Available"
                                : "Set Available"}
                            </button>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => beginInventoryEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="secondary-button danger-button"
                              type="button"
                              onClick={() => handleDeleteInventory(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                          <div className="movement-box">
                            <input
                              type="number"
                              min="0"
                              placeholder="Qty"
                              value={movementForms[item.id]?.quantity ?? ""}
                              onChange={(event) =>
                                updateMovementForm(item.id, {
                                  quantity: event.target.value,
                                })
                              }
                            />
                            <select
                              value={movementForms[item.id]?.type ?? "restock"}
                              onChange={(event) =>
                                updateMovementForm(item.id, {
                                  type: event.target.value,
                                })
                              }
                            >
                              <option value="restock">Restock</option>
                              <option value="usage">Usage</option>
                              <option value="waste">Waste</option>
                            </select>
                            <input
                              placeholder="Note"
                              value={movementForms[item.id]?.note ?? ""}
                              onChange={(event) =>
                                updateMovementForm(item.id, {
                                  note: event.target.value,
                                })
                              }
                            />
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => handleInventoryMovement(item)}
                            >
                              Apply Movement
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel owner-orders">
            <div className="panel-heading">
              <div>
                <p className="section-label">Order Stream</p>
                <h2>Incoming orders</h2>
                <p className="panel-note">
                  Review new orders and mark them paid after collection.
                </p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={handleRefreshOrders}
              >
                Refresh
              </button>
            </div>

            <p className="status-text">{ordersData.totalOrders} total orders</p>

            <div className="owner-list compact-list orders-grid">
              {ordersData.orders.length === 0 ? (
                <p className="empty-state">
                  No orders yet for this restaurant.
                </p>
              ) : (
                ordersData.orders.map((order) => (
                  <article className="order-card compact-order-card" key={order.id}>
                    <div className="order-card-head">
                      <div className="card-copy">
                        <h3>Order {order.id.slice(-6)}</h3>
                        <p className="card-meta">
                          {order.tableNumber
                            ? `Table ${order.tableNumber}`
                            : "No table number"}{" "}
                          • {new Date(order.time).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span
                        className={`badge ${
                          order.paymentStatus === "paid" ? "success-badge" : ""
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="order-status-strip">
                      <span className="metric-label">Progress</span>
                      <strong>{order.orderStatus ?? "new"}</strong>
                    </div>
                    <div className="order-lines">
                      {order.items.map((item) => (
                        <div
                          className="order-line compact-order-line"
                          key={`${order.id}-${item.recipeId}`}
                        >
                          <span>
                            {item.title} x {item.quantity}
                          </span>
                          <strong>{formatPrice(item.lineTotal)}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="order-total-row">
                      <span>Total</span>
                      <strong>{formatPrice(order.totalPrice)}</strong>
                    </div>
                    <button
                      className="secondary-button order-action-button"
                      type="button"
                      onClick={() => handleGenerateBill(order)}
                    >
                      Generate Bill
                    </button>
                    {order.paymentStatus !== "paid" ? (
                      <button
                        className="primary-button order-action-button"
                        type="button"
                        onClick={() => handleMarkOrderPaid(order.id)}
                      >
                        Mark as Paid
                      </button>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

function ChefPortalPage() {
  const [employee, setEmployee] = useState(() => readStoredEmployee());
  const [ordersData, setOrdersData] = useState({ totalOrders: 0, orders: [] });
  const [portalStatus, setPortalStatus] = useState("Chef portal ready");
  const [loginForm, setLoginForm] = useState({ employeeId: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(
    "Login with your employee credentials",
  );

  useEffect(() => {
    storeEmployee(employee);
  }, [employee]);

  async function refreshOrders(restaurantId) {
    if (!restaurantId) {
      return;
    }

    const payload = await requestJson(
      `/chef/orders?restaurant_id=${restaurantId}`,
    );
    setOrdersData({
      totalOrders: payload.data.totalOrders,
      orders: payload.data.orders,
    });
  }

  useEffect(() => {
    if (!employee?.restaurant?.id || employee?.member?.role !== "chef") {
      return;
    }

    refreshOrders(employee.restaurant.id).catch((error) =>
      setPortalStatus(error.message),
    );
  }, [employee?.member?.role, employee?.restaurant?.id]);

  async function handleEmployeeLogin(event) {
    event.preventDefault();
    setLoginLoading(true);

    try {
      const payload = await requestJson("/restaurant_owner/employees/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });
      const nextEmployee = normalizeEmployeeSession(payload.data);

      if (nextEmployee?.member?.role !== "chef") {
        throw new Error("These credentials do not belong to a chef account");
      }

      storeToken(payload.data.token);
      setEmployee(nextEmployee);
      setLoginStatus(payload.message);
      setPortalStatus("Chef authenticated successfully");
      setLoginForm({ employeeId: "", password: "" });
    } catch (error) {
      setLoginStatus(error.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRefreshOrders() {
    if (!employee?.restaurant?.id) {
      return;
    }

    try {
      await refreshOrders(employee.restaurant.id);
      setPortalStatus("Orders refreshed");
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleUpdateOrderStatus(orderId, orderStatus) {
    if (!employee?.restaurant?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        `/chef/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantId: employee.restaurant.id,
            orderStatus,
          }),
        },
      );

      setOrdersData((current) => ({
        ...current,
        orders: current.orders.map((order) =>
          order.id === orderId ? { ...order, orderStatus } : order,
        ),
      }));
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  if (!employee?.restaurant?.id || employee?.member?.role !== "chef") {
    return (
      <EmployeePortalLoginCard
        role="chef"
        form={loginForm}
        onChange={(event) =>
          setLoginForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
          }))
        }
        onSubmit={handleEmployeeLogin}
        loading={loginLoading}
        status={loginStatus}
      />
    );
  }

  return (
    <main className="page-shell owner-shell">
      <section className="hero-card owner-hero">
        <div>
          <p className="section-label">Chef Portal</p>
          <h1>{employee.restaurant.name}</h1>
          <p className="hero-text">
            Kitchen order board for preparing, completing, or cancelling dishes.
          </p>
        </div>
        <div className="hero-actions">
          <span className="badge ghost">{portalStatus}</span>
          <span className="badge">
            {employee.member.name || employee.member.employeeId}
          </span>
          <button
            className="secondary-button"
            type="button"
            onClick={handleRefreshOrders}
          >
            Refresh Orders
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              storeToken(null);
              setEmployee(null);
              setPortalStatus("Chef logged out");
            }}
          >
            Logout
          </button>
        </div>
      </section>

      <section className="panel owner-orders">
        <div className="panel-heading">
          <div>
            <p className="section-label">Kitchen Queue</p>
            <h2>Update food status</h2>
            <p className="panel-note">
              Status changes made here are visible in the restaurant owner
              portal.
            </p>
          </div>
          <p className="status-text panel-count">
            {ordersData.totalOrders} total orders
          </p>
        </div>

        <div className="owner-list compact-list orders-grid">
          {ordersData.orders.length === 0 ? (
            <p className="empty-state">No orders available for the kitchen.</p>
          ) : (
            ordersData.orders.map((order) => (
              <article className="order-card compact-order-card" key={order.id}>
                <div className="order-card-head">
                  <div className="card-copy">
                    <h3>Order {order.id.slice(-6)}</h3>
                    <p className="card-meta">
                      {order.tableNumber
                        ? `Table ${order.tableNumber}`
                        : "No table number"}{" "}
                      • {new Date(order.time).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="order-status-strip">
                  <span className="metric-label">Food status</span>
                  <strong>{order.orderStatus ?? "new"}</strong>
                </div>
                <div className="order-lines">
                  {order.items.map((item) => (
                    <div
                      className="order-line compact-order-line"
                      key={`${order.id}-${item.recipeId}`}
                    >
                      <span>
                        {item.title} x {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="order-progress-actions">
                  {["preparing", "completed", "cancelled"].map((status) => (
                    <button
                      key={`${order.id}-${status}`}
                      className={`secondary-button progress-button ${
                        order.orderStatus === status ? "toggle-inline-on" : ""
                      }`}
                      type="button"
                      onClick={() => handleUpdateOrderStatus(order.id, status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function WaiterPortalPage() {
  const [employee, setEmployee] = useState(() => readStoredEmployee());
  const [restaurant, setRestaurant] = useState(employee?.restaurant ?? null);
  const [menuStatus, setMenuStatus] = useState("Loading waiter menu...");
  const [tableNumber, setTableNumber] = useState("");
  const [lookupStatus, setLookupStatus] = useState(
    "Enter a table number to load the active order",
  );
  const [orderStatus, setOrderStatus] = useState("Select dishes to create an order");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [loginForm, setLoginForm] = useState({ employeeId: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(
    "Login with your employee credentials",
  );

  useEffect(() => {
    storeEmployee(employee);
  }, [employee]);

  useEffect(() => {
    if (!employee?.restaurant?.id || employee?.member?.role !== "waiter") {
      return;
    }

    requestJson(`/waiter/restaurants/${employee.restaurant.id}/menu`)
      .then((payload) => {
        setRestaurant(payload.data.restaurant);
        applyRestaurantTheme(payload.data.restaurant);
        setMenuStatus("Menu ready for waiter ordering");
      })
      .catch((error) => setMenuStatus(error.message));
  }, [employee?.member?.role, employee?.restaurant?.id]);

  const recipes = restaurant?.recipies ?? [];
  const selectedItems = recipes
    .map((item) => ({
      ...item,
      quantity: selectedQuantities[normalizeRecipeId(item.id)] ?? 0,
    }))
    .filter((item) => item.quantity > 0);
  const selectedTotal = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const hasPendingOrder = currentOrder?.paymentStatus === "pending";
  const canSubmitToTable =
    Boolean(tableNumber.trim()) && selectedItems.length > 0;

  function updateQuantity(recipeId, nextQuantity) {
    const normalizedRecipeId = normalizeRecipeId(recipeId);

    setSelectedQuantities((current) => {
      const nextState = { ...current };

      if (nextQuantity <= 0) {
        delete nextState[normalizedRecipeId];
      } else {
        nextState[normalizedRecipeId] = nextQuantity;
      }

      return nextState;
    });
  }

  async function handleEmployeeLogin(event) {
    event.preventDefault();
    setLoginLoading(true);

    try {
      const payload = await requestJson("/restaurant_owner/employees/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });
      const nextEmployee = normalizeEmployeeSession(payload.data);

      if (nextEmployee?.member?.role !== "waiter") {
        throw new Error("These credentials do not belong to a waiter account");
      }

      storeToken(payload.data.token);
      setEmployee(nextEmployee);
      setRestaurant(nextEmployee.restaurant);
      setLoginStatus(payload.message);
      setMenuStatus("Menu ready for waiter ordering");
      setLoginForm({ employeeId: "", password: "" });
    } catch (error) {
      setLoginStatus(error.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadPendingOrder(nextTableNumber = tableNumber) {
    const normalizedTableNumber = nextTableNumber.trim();

    if (!employee?.restaurant?.id || !normalizedTableNumber) {
      setCurrentOrder(null);
      setLookupStatus("Enter a table number to load the active order");
      return;
    }

    try {
      const payload = await requestJson(
        `/waiter/orders/pending?restaurant_id=${employee.restaurant.id}&tableNumber=${encodeURIComponent(normalizedTableNumber)}`,
      );
      const order = payload.data.order;

      setCurrentOrder(order);
      setLookupStatus(
        order
          ? `Loaded pending order ${order.id.slice(-6)} for table ${normalizedTableNumber}`
          : `No pending order for table ${normalizedTableNumber}. A new one will be created when you add items.`,
      );
    } catch (error) {
      setCurrentOrder(null);
      setLookupStatus(error.message);
    }
  }

  async function handleTableLookup(event) {
    event.preventDefault();
    await loadPendingOrder();
  }

  async function handleSubmitOrder() {
    if (
      !employee?.restaurant?.id ||
      !canSubmitToTable
    ) {
      return;
    }

    setSubmitting(true);
    setOrderStatus("Saving order...");

    try {
      const payload = await requestJson("/waiter/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: employee.restaurant.id,
          tableNumber: tableNumber.trim(),
          items: selectedItems.map((item) => ({
            recipeId: normalizeRecipeId(item.id),
            quantity: item.quantity,
          })),
        }),
      });

      setCurrentOrder(payload.data.order);
      setSelectedQuantities({});
      setOrderStatus(payload.message);
      setLookupStatus(
        `Active pending order ${payload.data.order.id.slice(-6)} loaded for table ${tableNumber.trim()}`,
      );
    } catch (error) {
      setOrderStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid() {
    if (!employee?.restaurant?.id || !currentOrder?.id) {
      return;
    }

    setMarkingPaid(true);
    setOrderStatus("Marking order as paid...");

    try {
      const payload = await requestJson(
        `/waiter/orders/${currentOrder.id}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantId: employee.restaurant.id,
            paymentStatus: "paid",
          }),
        },
      );

      setCurrentOrder((order) =>
        order ? { ...order, paymentStatus: "paid" } : order,
      );
      setOrderStatus(payload.message);
      setLookupStatus(`Table ${currentOrder.tableNumber} is now paid`);
    } catch (error) {
      setOrderStatus(error.message);
    } finally {
      setMarkingPaid(false);
    }
  }

  if (!employee?.restaurant?.id || employee?.member?.role !== "waiter") {
    return (
      <EmployeePortalLoginCard
        role="waiter"
        form={loginForm}
        onChange={(event) =>
          setLoginForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
          }))
        }
        onSubmit={handleEmployeeLogin}
        loading={loginLoading}
        status={loginStatus}
      />
    );
  }

  return (
    <main className="page-shell owner-shell">
      <section className="hero-card owner-hero">
        <div>
          <p className="section-label">Waiter Portal</p>
          <h1>{restaurant?.name ?? employee.restaurant.name}</h1>
          <p className="hero-text">
            Take table-side orders, append to the current pending bill, and
            close the table once payment is collected.
          </p>
        </div>
        <div className="hero-actions">
          <span className="badge ghost">{menuStatus}</span>
          <span className="badge">
            {employee.member.name || employee.member.employeeId}
          </span>
          <form className="stack-form" onSubmit={handleTableLookup}>
            <label>
              <span>Table Number</span>
              <input
                value={tableNumber}
                onChange={(event) => {
                  const nextTableNumber = event.target.value;

                  setTableNumber(nextTableNumber);

                  if (currentOrder?.tableNumber !== nextTableNumber.trim()) {
                    setCurrentOrder(null);
                    setLookupStatus("Press Load Table to fetch the active order");
                  }
                }}
                placeholder="Enter table number"
                required
              />
            </label>
            <button className="secondary-button" type="submit">
              Load Table
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                storeToken(null);
                setEmployee(null);
                setRestaurant(null);
                setCurrentOrder(null);
                setSelectedQuantities({});
                setMenuStatus("Waiter logged out");
              }}
            >
              Logout
            </button>
          </form>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel" style={{ gridColumn: "span 8" }}>
          <div className="panel-heading">
            <div>
              <p className="section-label">Menu</p>
              <h2>Build an order</h2>
            </div>
            <p className="status-text">{lookupStatus}</p>
          </div>

          <div className="menu-grid">
            {recipes.length === 0 ? (
              <p className="empty-state">No dishes available for this restaurant.</p>
            ) : (
              recipes.map((item) => {
                const quantity =
                  selectedQuantities[normalizeRecipeId(item.id)] ?? 0;

                return (
                  <article
                    className="dish-card"
                    key={normalizeRecipeId(item.id)}
                  >
                    <div className="dish-head">
                      <div>
                        <h3 className="dish-title">{item.title}</h3>
                        <p className="ingredients">
                          {item.ingredients?.join(" • ") ||
                            "Ingredients will be updated soon"}
                        </p>
                      </div>
                      <span className="price-pill">{formatPrice(item.price)}</span>
                    </div>
                    <div className="quantity-row">
                      <p className="price-note">Add items for the selected table.</p>
                      <div className="quantity-controls">
                        <button
                          className="quantity-button"
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity - 1)}
                        >
                          -
                        </button>
                        <span className="quantity-value">{quantity}</span>
                        <button
                          className="quantity-button"
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="panel order-panel" style={{ gridColumn: "span 4" }}>
          <div className="panel-heading">
            <div>
              <p className="section-label">Table Summary</p>
              <h2>{tableNumber.trim() ? `Table ${tableNumber.trim()}` : "Select table"}</h2>
            </div>
            <p className="status-text">{orderStatus}</p>
          </div>

          {currentOrder ? (
            <article className="order-card compact-order-card">
              <div className="order-card-head">
                <div className="card-copy">
                  <h3>Order {currentOrder.id.slice(-6)}</h3>
                  <p className="card-meta">
                    {new Date(currentOrder.time).toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={`badge ${
                    currentOrder.paymentStatus === "paid" ? "success-badge" : ""
                  }`}
                >
                  {currentOrder.paymentStatus}
                </span>
              </div>
              <div className="order-status-strip">
                <span className="metric-label">Kitchen status</span>
                <strong>{currentOrder.orderStatus}</strong>
              </div>
              <div className="order-lines">
                {currentOrder.items.map((item) => (
                  <div
                    className="order-line compact-order-line"
                    key={`${currentOrder.id}-${item.recipeId}`}
                  >
                    <span>
                      {item.title} x {item.quantity}
                    </span>
                    <strong>{formatPrice(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
              <div className="order-total-row">
                <span>Pending total</span>
                <strong>{formatPrice(currentOrder.totalPrice)}</strong>
              </div>
              {currentOrder.paymentStatus !== "paid" ? (
                <button
                  className="primary-button order-action-button"
                  type="button"
                  onClick={handleMarkPaid}
                  disabled={markingPaid}
                >
                  {markingPaid ? "Marking..." : "Mark as Paid"}
                </button>
              ) : null}
            </article>
          ) : (
            <p className="empty-state">
              No pending order loaded for this table yet.
            </p>
          )}

          {selectedItems.length === 0 ? (
            <p className="empty-state">No new items selected.</p>
          ) : (
            <div className="owner-list">
              {selectedItems.map((item) => (
                <article
                  className="owner-list-item"
                  key={normalizeRecipeId(item.id)}
                >
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <strong>{formatPrice(item.quantity * item.price)}</strong>
                </article>
              ))}
            </div>
          )}

          <div className="order-total-row">
            <span>New items total</span>
            <strong>{formatPrice(selectedTotal)}</strong>
          </div>

          <button
            className="primary-button place-order-button"
            type="button"
            onClick={handleSubmitOrder}
            disabled={!canSubmitToTable || submitting}
          >
            {submitting
              ? "Saving..."
              : hasPendingOrder
                ? "Add to Pending Order"
                : "Create Pending Order"}
          </button>
        </aside>
      </section>
    </main>
  );
}

function CustomerMenuPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const restaurantId = searchParams.get("restaurantId");
  const tableNumber = searchParams.get("tableNumber");
  const [status, setStatus] = useState("Loading menu...");
  const [restaurant, setRestaurant] = useState(null);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [orderStatus, setOrderStatus] = useState("Select dishes to continue");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      setStatus("Missing restaurantId in the menu URL.");
      return;
    }

    requestJson(`/api/restaurants/${restaurantId}/menu`)
      .then((payload) => {
        setRestaurant(payload.data.restaurant);
        setStatus("Freshly loaded from the restaurant record");
        applyRestaurantTheme(payload.data.restaurant);
      })
      .catch((error) => setStatus(error.message));
  }, [restaurantId]);

  const recipes = restaurant?.recipies ?? [];
  const selectedItems = recipes
    .map((item) => ({
      ...item,
      quantity: selectedQuantities[normalizeRecipeId(item.id)] ?? 0,
    }))
    .filter((item) => item.quantity > 0);
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  function updateQuantity(recipeId, nextQuantity) {
    const normalizedRecipeId = normalizeRecipeId(recipeId);

    setSelectedQuantities((current) => {
      const nextState = { ...current };

      if (nextQuantity <= 0) {
        delete nextState[normalizedRecipeId];
      } else {
        nextState[normalizedRecipeId] = nextQuantity;
      }

      return nextState;
    });
  }

  async function placeOrder() {
    if (!restaurant || selectedItems.length === 0) {
      return;
    }

    setSubmitting(true);
    setOrderStatus("Submitting order...");

    try {
      const payload = await requestJson("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableNumber,
          items: selectedItems.map((item) => ({
            recipeId: normalizeRecipeId(item.id),
            quantity: item.quantity,
          })),
        }),
      });

      setSelectedQuantities({});
      setOrderStatus(
        `Order placed at ${new Date(payload.data.order.time).toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        )}`,
      );
    } catch (error) {
      setOrderStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!restaurant) {
    return (
      <main className="page-shell menu-shell">
        <section className="hero-card">
          <p className="section-label">Digital Menu</p>
          <h1>Menu unavailable</h1>
          <p className="hero-text">{status}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell menu-shell">
      <section className="hero-card">
        <p className="section-label">Digital Menu</p>
        <div className="hero-header">
          <div>
            <h1>{restaurant.name}</h1>
            <p className="hero-text">
              {recipes.length} handpicked dishes currently listed for this
              restaurant.
            </p>
          </div>
          <div className="menu-badges">
            {tableNumber ? (
              <span className="badge">Table {tableNumber}</span>
            ) : null}
            <span className="badge ghost">
              {recipes.length} item{recipes.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Today&apos;s Spread</p>
              <h2>Menu Highlights</h2>
            </div>
            <p className="status-text">{status}</p>
          </div>

          <div className="menu-grid">
            {recipes.length === 0 ? (
              <p className="empty-state">
                No dishes added yet for this restaurant.
              </p>
            ) : (
              recipes.map((item) => {
                const quantity =
                  selectedQuantities[normalizeRecipeId(item.id)] ?? 0;

                return (
                  <article
                    className="dish-card"
                    key={normalizeRecipeId(item.id)}
                  >
                    <div className="dish-head">
                      <div>
                        <h3 className="dish-title">{item.title}</h3>
                        <p className="ingredients">
                          {item.ingredients?.join(" • ") ||
                            "Ingredients will be updated soon"}
                        </p>
                      </div>
                      <span className="price-pill">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <div className="quantity-row">
                      <p className="price-note">
                        Prepared for dine-in ordering.
                      </p>
                      <div className="quantity-controls">
                        <button
                          className="quantity-button"
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity - 1)}
                        >
                          -
                        </button>
                        <span className="quantity-value">{quantity}</span>
                        <button
                          className="quantity-button"
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="panel order-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Your Order</p>
              <h2>Cart Summary</h2>
            </div>
            <p className="status-text">{orderStatus}</p>
          </div>

          {selectedItems.length === 0 ? (
            <p className="empty-state">No items selected yet.</p>
          ) : (
            <div className="owner-list">
              {selectedItems.map((item) => (
                <article
                  className="owner-list-item"
                  key={normalizeRecipeId(item.id)}
                >
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <strong>{formatPrice(item.quantity * item.price)}</strong>
                </article>
              ))}
            </div>
          )}

          <div className="order-total-row">
            <span>Total</span>
            <strong>{formatPrice(totalPrice)}</strong>
          </div>

          <button
            className="primary-button place-order-button"
            type="button"
            onClick={placeOrder}
            disabled={selectedItems.length === 0 || submitting}
          >
            {submitting ? "Submitting..." : "Place Order"}
          </button>
        </aside>
      </section>
    </main>
  );
}

function HomePage() {
  return (
    <main className="page-shell home-shell">
      <section className="hero-card landing-card">
        <p className="section-label">React + Vite Client</p>
        <h1>Restaurant owner tools and QR ordering in one client.</h1>
        <p className="hero-text">
          Use the owner portal to register restaurants, add dishes, generate
          table QR links, and review orders. The customer menu route keeps the
          same QR flow.
        </p>
        <div className="landing-actions">
          <Link className="primary-button link-button" to="/owner">
            Open Owner Portal
          </Link>
          <Link className="secondary-button link-button" to="/chef">
            Open Chef Portal
          </Link>
          <Link className="secondary-button link-button" to="/waiter">
            Open Waiter Portal
          </Link>
          <Link className="secondary-button link-button" to="/menu">
            Open Menu Route
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <>
      <PanelSwitcher />
      <Routes>
        {/* ── Auth routes (public) ─────────────────────────────────────── */}
        <Route path="/owner/login" element={<OwnerLoginPage />} />
        <Route path="/staff/login" element={<StaffLoginPage />} />

        {/* ── Owner portal (protected) ─────────────────────────────────── */}
        <Route
          path="/"
          element={<OwnerRoute><OwnerDashboard /></OwnerRoute>}
        />
        <Route
          path="/dashboard"
          element={<OwnerRoute><OwnerDashboard /></OwnerRoute>}
        />
        <Route
          path="/menu-management"
          element={<OwnerRoute><MenuManagement /></OwnerRoute>}
        />
        <Route path="/qr" element={<OwnerRoute><QrManagement /></OwnerRoute>} />
        <Route path="/offers" element={<OwnerRoute><Offers /></OwnerRoute>} />
        <Route path="/orders" element={<OwnerRoute><ManageOrders /></OwnerRoute>} />
        <Route path="/bill" element={<OwnerRoute><BillDetails /></OwnerRoute>} />
        <Route path="/cancellations" element={<OwnerRoute><Cancellations /></OwnerRoute>} />
        <Route path="/menu-items" element={<OwnerRoute><MenuItems /></OwnerRoute>} />
        <Route path="/live-monitor" element={<OwnerRoute><LiveMonitor /></OwnerRoute>} />
        <Route path="/store-settings" element={<OwnerRoute><StoreSettings /></OwnerRoute>} />
        <Route path="/staff" element={<OwnerRoute><StaffManagement /></OwnerRoute>} />
        <Route path="/profile" element={<OwnerRoute><Profile /></OwnerRoute>} />

        {/* ── Customer QR ordering app (public — OTP guards internally) ── */}
        <Route path="/order/*" element={<CustomerApp />} />

        {/* ── Staff portals (protected by role) ────────────────────────── */}
        <Route
          path="/chef"
          element={<StaffRoute role="chef"><ChefDashboard /></StaffRoute>}
        />
        <Route
          path="/waiter/*"
          element={<StaffRoute role="waiter"><WaiterApp /></StaffRoute>}
        />

        {/* ── Manager portal ────────────────────────────────────────────── */}
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/orders" element={<ManagerOrders />} />
        <Route path="/manager/live" element={<ManagerLiveMonitoring />} />
        <Route path="/manager/requests" element={<ManagerRequests />} />
        <Route path="/manager/tables" element={<ManagerTables />} />

        {/* ── Platform Admin portal ─────────────────────────────────────── */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* ── Legacy debug portals (kept for reference, behind /legacy/*) ── */}
        <Route
          path="/legacy/*"
          element={
            <AppShell>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/owner" element={<OwnerPortalPage />} />
                <Route path="/chef" element={<ChefPortalPage />} />
                <Route path="/waiter" element={<WaiterPortalPage />} />
                <Route path="/menu" element={<CustomerMenuPage />} />
              </Routes>
            </AppShell>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
