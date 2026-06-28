import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  IndianRupee,
  QrCode,
  ShoppingBag,
  Tag,
  Upload,
  Users,
  X,
} from "lucide-react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MANAGER_PROFILE = {
  restaurantName: "Saffron Kitchen",
  userName: "Alex Mercer",
  role: "Manager",
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const STAT_META = [
  {
    key: "activeVisitors",
    label: "Active Visitors",
    sub: "Currently",
    icon: Users,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    live: true,
  },
  {
    key: "itemsViewed",
    label: "Items Viewed",
    sub: "Today",
    icon: BookOpen,
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    key: "ordersPlaced",
    label: "Orders Placed",
    sub: "Today",
    icon: ShoppingBag,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    key: "liveRevenue",
    label: "Live Revenue",
    sub: "Today",
    icon: IndianRupee,
    iconBg: "bg-brand-maroon/20",
    iconColor: "text-brand-maroon",
    fmt: formatPrice,
  },
  {
    key: "qrScans",
    label: "QR Scans",
    sub: "Today",
    icon: QrCode,
    iconBg: "bg-gray-500/20",
    iconColor: "text-gray-400",
  },
];

function IntentBadge({ score }) {
  if (score >= 80)
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase text-emerald-700">
        High
      </span>
    );
  if (score >= 60)
    return (
      <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold uppercase text-orange-600">
        Medium
      </span>
    );
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase text-gray-500">
      Low
    </span>
  );
}

function ItemPills({ items, max = 2 }) {
  const shown = items.slice(0, max);
  const extra = items.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((i) => (
        <span
          key={i}
          className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-orange"
        >
          {i}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-orange">
          +{extra} More
        </span>
      )}
    </div>
  );
}

function CustomerCell({ name, id }) {
  const custId = id ? `#CUST-${String(id).slice(-4).toUpperCase()}` : "";
  return (
    <TableCell className="pl-6">
      <p className="font-bold leading-snug">{name}</p>
      {custId && <p className="text-xs text-muted-foreground">{custId}</p>}
    </TableCell>
  );
}

function lastVisitMeta(lastVisit = "") {
  const lower = lastVisit.toLowerCase();
  if (lower.includes("5h") || lower.includes("1h") || lower.includes("2h"))
    return { label: "ACTIVE", color: "text-emerald-600" };
  if (lower.includes("1d") || lower.includes("yesterday"))
    return { label: "YESTERDAY", color: "text-emerald-600" };
  return null;
}

function CustomerDetailsDrawer({ visitor, onClose }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Build cart items: use cartItems if present, otherwise derive from interestedIn
  const cartItems = visitor.cartItems ?? visitor.interestedIn.map((name, i) => ({
    name,
    quantity: i === 0 ? 2 : 1,
    price: Math.round(visitor.cartValue / visitor.interestedIn.length),
    image: null,
  }));

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/10 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-cream/60 px-5 py-4">
          <p className="text-lg font-bold text-[#24190f]">Customer Details</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-brand-cream/30 hover:text-[#24190f]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items in cart */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Items in Cart
          </p>
          <div className="space-y-3">
            {cartItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-brand-cream/60 bg-[#FAFAF8] p-3"
              >
                {/* Image placeholder */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-saffron/40 to-brand-orange/30">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold leading-snug text-[#24190f]">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                </div>
                <p className="shrink-0 font-bold text-brand-maroon">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-brand-cream/60 px-5 py-4">
          <button
            type="button"
            onClick={() => navigate("/offers")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3.5 text-base font-bold text-white hover:brightness-105"
          >
            <Tag className="h-5 w-5" />
            Create Offer
          </button>
        </div>
      </div>
    </>
  );
}

export default function ManagerLiveMonitoring() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  useEffect(() => {
    requestJson("/manager/live-monitoring")
      .then((payload) => setData(payload.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error && !data) {
    return (
      <DashboardLayout profile={MANAGER_PROFILE}>
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </DashboardLayout>
    );
  }
  if (!data) {
    return (
      <DashboardLayout profile={MANAGER_PROFILE}>
        <p className="text-muted-foreground">Loading live monitoring…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout profile={MANAGER_PROFILE}>
      {/* ── Header + Stats ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold">Live Monitoring</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              LIVE
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor real-time customer activity across your restaurant ecosystem.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-[#EFE7DD] bg-white text-[#24190F] hover:bg-white hover:text-[#24190F] focus-visible:ring-0"
        >
          <Upload className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {STAT_META.map((meta) => {
          const Icon = meta.icon;
          const raw = data.stats[meta.key];
          const display = meta.fmt ? meta.fmt(raw) : raw;
          return (
            <div key={meta.key} className="rounded-2xl border border-brand-cream/70 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className={cn("rounded-xl p-2.5", meta.iconBg)}>
                  <Icon className={cn("h-5 w-5", meta.iconColor)} />
                </span>
                {meta.live && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {meta.label}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <strong className="text-3xl font-bold leading-none text-[#24190f]">
                  {display}
                </strong>
                <span className="text-sm text-muted-foreground">{meta.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Visitors ── */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-base font-bold">Active Visitors</h2>
            <p className="text-xs text-muted-foreground">
              Customers who added items to cart and are actively considering a purchase.
            </p>
          </div>
          <Button className="bg-brand-gradient text-white hover:brightness-105">
            Create Targeted Offer
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Interested In</TableHead>
                <TableHead>Cart Value</TableHead>
                <TableHead>Time Active</TableHead>
                <TableHead>Intent Score</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.activeVisitors.map((v) => (
                <TableRow key={v.id}>
                  <CustomerCell name={v.name} id={v.id} />
                  <TableCell className="text-xs text-muted-foreground">
                    <p>{v.phone}</p>
                    <p>{v.email}</p>
                  </TableCell>
                  <TableCell>
                    <ItemPills items={v.interestedIn} max={2} />
                  </TableCell>
                  <TableCell>
                    <p className="font-bold">{formatPrice(v.cartValue)}</p>
                    <p className="text-xs text-muted-foreground">{v.interestedIn.length} Items</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{v.timeActive}</TableCell>
                  <TableCell>
                    <IntentBadge score={v.intentScore} />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedVisitor(v)}
                      className="rounded-full border-0 bg-[#FDEEE8] px-3.5 py-1.5 text-sm font-medium text-brand-maroon hover:bg-brand-maroon/15"
                    >
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {data.activeVisitors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No active visitors right now.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Repeat Visitors ── */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-base font-bold">Repeat Visitors</h2>
          </div>
          <Button className="bg-brand-gradient text-white hover:brightness-105">
            Create Targeted Offer
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tip banner */}
          <div className="mx-6 mb-4 rounded-xl border border-brand-cream/60 bg-[#FAFAF8] px-4 py-3 text-sm text-[#5a403e]">
            Reward your top 10% of repeat customers with a special{" "}
            <span className="font-semibold text-brand-orange">'Thank You'</span> discount to
            drive retention.
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Favorite Dishes</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Lifetime Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.repeatVisitors.map((v) => {
                const meta = lastVisitMeta(v.lastVisit);
                return (
                  <TableRow key={v.id}>
                    <CustomerCell name={v.name} id={v.id} />
                    <TableCell>
                      <ItemPills items={v.favoriteDishes} max={2} />
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{v.visits} Visits</p>
                      <p className="text-xs text-muted-foreground">Subtotal Last 30 Days</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-muted-foreground">{v.lastVisit}</p>
                      {meta && (
                        <p className={cn("text-[10px] font-bold uppercase", meta.color)}>
                          {meta.label}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.status === "VIP" ? (
                        <span className="rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold text-pink-600">
                          VIP
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">
                          REGULAR
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right font-bold text-[#24190f]">
                      {formatPrice(v.lifetimeValue)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.repeatVisitors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No repeat visitors yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedVisitor && (
        <CustomerDetailsDrawer
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </DashboardLayout>
  );
}
