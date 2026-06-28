import { useLocation, useNavigate } from "react-router-dom";
import { BellRing, Home, ReceiptText, Settings, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWaiter } from "./WaiterApp";

export function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const NAV = [
  { to: "/waiter",          label: "Home",     icon: Home,          exact: true },
  { to: "/waiter/menu",     label: "Menu",      icon: UtensilsCrossed },
  { to: "/waiter/orders",   label: "Orders",    icon: ReceiptText },
  { to: "/waiter/requests", label: "Requests",  icon: BellRing },
  { to: "/waiter/settings", label: "Settings",  icon: Settings },
];

function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { cartCount } = useWaiter();

  function isActive(item) {
    return item.exact ? pathname === item.to : pathname.startsWith(item.to);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-brand-cream/60 bg-white">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        const isMenu = item.to === "/waiter/menu";
        return (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[11px] font-semibold transition-colors",
              active ? "text-brand-orange" : "text-muted-foreground hover:text-[#24190f]",
            )}
          >
            <span className="relative">
              <Icon
                className={cn("h-5 w-5", active && "stroke-brand-orange")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {isMenu && cartCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* Shared page topbar — used by screens that don't have their own header */
export function WaiterPageHeader({ title, subtitle, right }) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-brand-cream/60 bg-[#FAFAF8] px-4 py-3.5 sm:px-6">
      <div>
        <p className="text-lg font-bold text-[#24190f]">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

/* Main layout wrapper — no sidebar, just background + bottom nav padding */
export default function WaiterLayout({ children }) {
  return (
    <div className="min-h-screen bg-brand-page font-sans text-[#24190f]">
      <div className="pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
