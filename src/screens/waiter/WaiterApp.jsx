// Waiter portal (/waiter/*) — Figma nodes 17:362 (dashboard) & 17:513 (menu).
// A light-sidebar staff portal with shared "active table + running order" state
// so the waiter can build an order on the Menu screen and place it from the
// Dashboard (PRD §11).

import { createContext, useContext, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import WaiterDashboard from "./WaiterDashboard";
import WaiterMenu from "./WaiterMenu";
import WaiterOrders from "./WaiterOrders";
import WaiterRequests from "./WaiterRequests";
import WaiterSettings from "./WaiterSettings";

const WaiterContext = createContext(null);

export function useWaiter() {
  const ctx = useContext(WaiterContext);
  if (!ctx) throw new Error("useWaiter must be used within WaiterApp");
  return ctx;
}

export default function WaiterApp() {
  const [activeTable, setActiveTable] = useState("T-08");
  const [cart, setCart] = useState([]);

  const api = useMemo(() => {
    function addToCart(item) {
      setCart((current) => {
        const existing = current.find((line) => line.id === item.id);
        if (existing) {
          return current.map((line) =>
            line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line,
          );
        }
        return [
          ...current,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            foodType: item.foodType,
            quantity: 1,
            note: "",
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
    function clearCart() {
      setCart([]);
    }
    return { addToCart, setQuantity, clearCart };
  }, []);

  const value = {
    activeTable,
    setActiveTable,
    cart,
    cartCount: cart.reduce((sum, l) => sum + l.quantity, 0),
    subtotal: cart.reduce((sum, l) => sum + l.price * l.quantity, 0),
    ...api,
  };

  return (
    <WaiterContext.Provider value={value}>
      <Routes>
        <Route index element={<WaiterDashboard />} />
        <Route path="menu" element={<WaiterMenu />} />
        <Route path="orders" element={<WaiterOrders />} />
        <Route path="requests" element={<WaiterRequests />} />
        <Route path="settings" element={<WaiterSettings />} />
        <Route path="*" element={<Navigate to="/waiter" replace />} />
      </Routes>
    </WaiterContext.Provider>
  );
}
