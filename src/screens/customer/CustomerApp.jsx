// Customer QR ordering app (/order/*) — PRD §5–§9. A self-contained mobile-first
// flow with its own nested routes and shared session + cart state (persisted to
// localStorage so the OTP redirect and refreshes keep context). Mounted from
// App.jsx as a single `/order/*` route.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useCustomerAuth } from "@/context/CustomerAuthContext";

import QrLanding from "./QrLanding";
import CustomerLogin from "./CustomerLogin";
import OtpVerify from "./OtpVerify";
import Menu from "./Menu";
import ItemDetail from "./ItemDetail";
import Cart from "./Cart";
import Confirmation from "./Confirmation";
import OrderStatus from "./OrderStatus";
import Offers from "./Offers";
import CustomerHelp from "./CustomerHelp";
import CustomerProfile from "./CustomerProfile";

const SESSION_KEY = "yulo_customer_session";
const CART_KEY = "yulo_customer_cart";

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

const CustomerContext = createContext(null);

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerApp");
  return ctx;
}

export default function CustomerApp() {
  const [session, setSession] = useState(() =>
    readJson(SESSION_KEY, { verified: false, mobile: "", name: "", tableNumber: "", orderType: "dine-in" }),
  );
  const [cart, setCart] = useState(() => readJson(CART_KEY, []));

  useEffect(() => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const api = useMemo(() => {
    function addToCart(item, quantity = 1, instructions = "") {
      setCart((current) => {
        const existing = current.find((line) => line.id === item.id);
        if (existing) {
          return current.map((line) =>
            line.id === item.id
              ? { ...line, quantity: line.quantity + quantity, instructions: instructions || line.instructions }
              : line,
          );
        }
        return [
          ...current,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            foodType: item.foodType,
            quantity,
            instructions,
          },
        ];
      });
    }

    function setQuantity(id, quantity) {
      setCart((current) =>
        quantity <= 0
          ? current.filter((line) => line.id !== id)
          : current.map((line) => (line.id === id ? { ...line, quantity } : line)),
      );
    }

    function removeFromCart(id) {
      setCart((current) => current.filter((line) => line.id !== id));
    }

    function clearCart() {
      setCart([]);
    }

    return { addToCart, setQuantity, removeFromCart, clearCart };
  }, []);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const auth = useCustomerAuth();

  const value = {
    session,
    setSession,
    cart,
    cartCount,
    cartTotal,
    auth,
    ...api,
  };

  return (
    <CustomerContext.Provider value={value}>
      <Routes>
        <Route index element={<QrLanding />} />
        <Route path="login" element={<CustomerLogin />} />
        <Route path="otp" element={<OtpVerify />} />
        <Route path="menu" element={<Guard><Menu /></Guard>} />
        <Route path="item/:id" element={<Guard><ItemDetail /></Guard>} />
        <Route path="cart" element={<Guard><Cart /></Guard>} />
        <Route path="confirmation/:orderId" element={<Guard><Confirmation /></Guard>} />
        <Route path="status/:orderId" element={<Guard><OrderStatus /></Guard>} />
        <Route path="offers" element={<Guard><Offers /></Guard>} />
        <Route path="help" element={<Guard><CustomerHelp /></Guard>} />
        <Route path="profile" element={<Guard><CustomerProfile /></Guard>} />
        <Route path="*" element={<Navigate to="/order" replace />} />
      </Routes>
    </CustomerContext.Provider>
  );
}

// Redirect unauthenticated customers to login, preserving intended destination.
function Guard({ children }) {
  const { auth, session } = useCustomer();
  const location = useLocation();
  if (!auth.isAuthenticated && !session.verified) {
    return <Navigate to="/order/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
