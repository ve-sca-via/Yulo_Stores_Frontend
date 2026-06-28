// Shared shell for the owner-facing screens: Sidebar + top app bar + content.
// The top app bar chrome is identical across screens (Figma header 88px).

import { useState } from "react";
import { Menu } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOwnerAuthSafe } from "@/context/OwnerAuthContext";

export function Topbar({ profile, onMenuToggle }) {
  // Pull live data from owner auth context; fall back to explicit profile prop (manager screens)
  const ownerCtx = useOwnerAuthSafe();
  const user         = ownerCtx?.user;
  const restaurant   = ownerCtx?.restaurant;

  const displayName    = user?.name ?? profile?.name ?? profile?.userName ?? "Owner";
  const displayRole    = user?.role ?? profile?.role ?? "Owner";
  const restaurantName = restaurant?.name ?? profile?.restaurantName ?? "Yulo Stores";
  const initials       = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="flex items-center justify-between rounded-xl border border-brand-cream/60 bg-[#FAFAF8] px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.07)] sm:px-5">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="grid h-9 w-9 place-items-center rounded-lg border border-brand-cream/70 text-[#5a403e] hover:bg-[#f5ede4] lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="h-9 w-9 shrink-0 rounded-full bg-brand-dark2" />
        <span className="text-lg font-bold text-brand-red sm:text-xl">
          {restaurantName}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3.5">
        <Avatar>
          <AvatarFallback className="bg-brand-gradient text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-semibold">{displayName}</span>
          <span className="text-xs text-muted-foreground">{displayRole}</span>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children, profile }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-brand-page font-sans text-[#24190f]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 bg-brand-page px-4 py-3 sm:px-6 lg:px-7">
          <Topbar profile={profile} onMenuToggle={() => setSidebarOpen((o) => !o)} />
        </div>
        <main className="flex flex-col gap-5 px-4 pb-12 pt-2 sm:px-6 lg:px-7">
          {children}
        </main>
      </div>
    </div>
  );
}
