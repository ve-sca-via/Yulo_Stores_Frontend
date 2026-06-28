// Floating dev/navigation switcher — a bottom-right FAB that opens a grouped
// menu for jumping between every panel and dashboard in the app (customer,
// owner, staff, manager). Rendered globally from App so it's always reachable.

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChefHat,
  LayoutGrid,
  ShieldCheck,
  Smartphone,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

const GROUPS = [
  {
    title: "Customer",
    icon: Smartphone,
    links: [{ to: "/order", label: "QR Ordering App" }],
  },
  {
    title: "Owner",
    icon: Store,
    links: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/menu-management", label: "Menu Management" },
      { to: "/menu-items", label: "Menu Items" },
      { to: "/qr", label: "QR Management" },
      { to: "/offers", label: "Offers & Coupons" },
      { to: "/orders", label: "Manage Orders" },
      { to: "/cancellations", label: "Cancellations" },
      { to: "/store-settings", label: "Store Settings" },
      { to: "/profile", label: "Profile" },
    ],
  },
  {
    title: "Manager",
    icon: LayoutGrid,
    links: [
      { to: "/manager/orders", label: "Operations / Orders" },
      { to: "/manager/tables", label: "Table Management" },
      { to: "/manager/live", label: "Live Monitoring" },
      { to: "/manager/requests", label: "Customer Requests" },
    ],
  },
  {
    title: "Staff",
    icon: ChefHat,
    links: [
      { to: "/chef", label: "Chef · Kitchen Display" },
      { to: "/waiter", label: "Waiter Dashboard" },
      { to: "/waiter/menu", label: "Waiter Menu" },
      { to: "/waiter/requests", label: "Waiter Requests" },
    ],
  },
  {
    title: "Platform Admin",
    icon: ShieldCheck,
    links: [
      { to: "/admin", label: "Platform Dashboard" },
      { to: "/admin/restaurants", label: "Restaurants" },
      { to: "/admin/users", label: "Users & Customers" },
      { to: "/admin/roles", label: "Staff & Roles" },
      { to: "/admin/qr", label: "QR Management" },
      { to: "/admin/orders", label: "Order Monitoring" },
      { to: "/admin/offers", label: "Offer Monitoring" },
      { to: "/admin/activity", label: "Activity Logs" },
      { to: "/admin/settings", label: "System Settings" },
    ],
  },
];

export default function PanelSwitcher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function go(to) {
    navigate(to);
    setOpen(false);
  }

  const isActive = (to) =>
    to === "/order"
      ? pathname.startsWith("/order")
      : to === "/waiter" || to === "/admin"
        ? pathname === to
        : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 print:hidden">
      {open ? (
        <div className="w-72 overflow-hidden rounded-2xl border border-brand-cream/70 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-brand-cream/60 bg-[#FAFAF8] px-4 py-3">
            <span className="text-sm font-bold">Switch Panel</span>
            <span className="text-[11px] text-muted-foreground">dev navigation</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className="mb-2 last:mb-0">
                  <p className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" /> {group.title}
                  </p>
                  <div className="flex flex-col">
                    {group.links.map((link) => (
                      <button
                        key={link.to}
                        type="button"
                        onClick={() => go(link.to)}
                        className={cn(
                          "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          isActive(link.to)
                            ? "bg-brand-gradient font-semibold text-white"
                            : "text-[#3f2d27] hover:bg-brand-cream/40",
                        )}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close panel switcher" : "Open panel switcher"}
        className="grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-white shadow-[0_10px_30px_rgba(164,22,26,0.4)] transition hover:brightness-110"
      >
        {open ? <X className="h-6 w-6" /> : <UtensilsCrossed className="h-6 w-6" />}
      </button>
    </div>
  );
}
