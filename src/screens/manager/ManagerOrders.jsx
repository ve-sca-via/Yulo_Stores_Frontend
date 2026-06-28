// Manager · Operations Command Center (/manager/orders) — Figma nodes 130:968 /
// 182:707 / 183:1401. Live order control split into Dine-in and Online, with
// status pills, filter tabs, and a slide-over detail/bill drawer (PRD §12 MGR-01,
// §9 lifecycle). Status + payment changes write back to the shared order store.

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Ban, Search, X } from "lucide-react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MANAGER_PROFILE = { restaurantName: "Saffron Kitchen", userName: "Alex Mercy", role: "Manager" };

const TABS = ["All Orders", "New", "Ready to Serve", "Bill Generated", "Completed", "Delayed", "Cancelled"];

const NEXT_STEP = {
  new: { label: "Accept", to: "accepted" },
  accepted: { label: "Start Preparing", to: "preparing" },
  preparing: { label: "Mark Ready", to: "ready" },
  ready: { label: "Mark Served", to: "served" },
  served: { label: "Complete", to: "completed" },
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
function orderTotal(order) {
  return order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function channelOf(order) {
  return order.channel ?? (order.tableNumber ? "dine-in" : "online");
}
// Orders still active past this threshold are flagged delayed (PRD §12.3).
const DELAY_THRESHOLD_MIN = 15;
function minsSince(value) {
  return Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
}
function isDelayed(order) {
  return ["new", "accepted", "preparing"].includes(order.orderStatus) && minsSince(order.time) > DELAY_THRESHOLD_MIN;
}
function statusVariant(status) {
  const k = (status ?? "").toLowerCase();
  if (k === "completed" || k === "served") return "ok";
  if (k === "ready") return "info";
  if (k === "preparing" || k === "accepted") return "warn";
  if (k === "cancelled" || k === "rejected") return "danger";
  return "muted";
}
// Maps an order to the filter-tab bucket.
function bucketOf(order) {
  if (order.orderStatus === "cancelled" || order.orderStatus === "rejected") return "Cancelled";
  if (order.orderStatus === "completed") return "Completed";
  if (order.paymentStatus === "paid") return "Bill Generated";
  if (order.orderStatus === "ready") return "Ready to Serve";
  if (order.orderStatus === "new") return "New";
  return "Preparing";
}

function Pill({ label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[120px] rounded-xl border p-3 text-left transition",
        active ? "border-brand-orange bg-brand-orange/5" : "border-brand-cream/70 bg-white hover:bg-brand-cream/20",
      )}
    >
      <strong className="block text-2xl font-bold leading-none">{value}</strong>
      <span className="mt-1.5 block text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

function OrdersTable({ orders, onView }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-brand-cream/60">
          <TableHead className="pl-6">Order ID</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="pr-6 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="pl-6">
              <span className="font-semibold">#ORD-{order.id.slice(-4)}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {order.tableNumber ? `Table ${order.tableNumber}` : "Online"}
              </span>
            </TableCell>
            <TableCell className="max-w-[220px] truncate text-muted-foreground">
              {order.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}
            </TableCell>
            <TableCell>
              <Badge variant={order.paymentStatus === "paid" ? "ok" : "muted"} className="capitalize">
                {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
              </Badge>
            </TableCell>
            <TableCell className="font-semibold">{formatPrice(orderTotal(order))}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <Badge variant={statusVariant(order.orderStatus)} className="capitalize">
                  {order.orderStatus}
                </Badge>
                {isDelayed(order) ? <Badge variant="danger">DELAYED</Badge> : null}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatTime(order.time)}</TableCell>
            <TableCell className="pr-6 text-right">
              <button type="button" onClick={() => onView(order)} className="rounded-full border-0 bg-[#FDEEE8] px-3.5 py-1.5 text-sm font-medium text-brand-maroon hover:bg-brand-maroon/15">
                View Details
              </button>
            </TableCell>
          </TableRow>
        ))}
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              No orders in this view.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}

export default function ManagerOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("All Orders");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [alerts, setAlerts] = useState([]);

  function load() {
    requestJson("/restaurant_owner/orders")
      .then((payload) => setOrders(payload.data.orders))
      .catch((err) => setError(err.message));
  }

  function loadAlerts() {
    requestJson("/manager/kitchen-alerts")
      .then((payload) => setAlerts(payload.data.alerts.filter((a) => a.status === "open")))
      .catch(() => {});
  }

  useEffect(load, []);

  useEffect(() => {
    loadAlerts();
    const id = window.setInterval(loadAlerts, 5000);
    return () => window.clearInterval(id);
  }, []);

  async function resolveAlert(alert) {
    setAlerts((cur) => cur.filter((a) => a.id !== alert.id));
    try {
      await requestJson(`/manager/kitchen-alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
    } catch (err) {
      setError(err.message);
      loadAlerts();
    }
  }

  async function patch(path, body) {
    await requestJson(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const refreshed = await requestJson("/restaurant_owner/orders");
    setOrders(refreshed.data.orders);
    setSelected((cur) => (cur ? refreshed.data.orders.find((o) => o.id === cur.id) ?? null : null));
  }

  async function advance(order) {
    const step = NEXT_STEP[order.orderStatus];
    if (!step) return;
    try {
      await patch(`/restaurant_owner/orders/${order.id}/status`, { orderStatus: step.to });
    } catch (err) {
      setError(err.message);
    }
  }
  async function markPaid(order) {
    try {
      await patch(`/restaurant_owner/orders/${order.id}/payment`, { paymentStatus: "paid", restaurantId: "rest_1" });
    } catch (err) {
      setError(err.message);
    }
  }

  const counts = useMemo(() => {
    const list = orders ?? [];
    return {
      "All Orders": list.length,
      New: list.filter((o) => o.orderStatus === "new").length,
      Preparing: list.filter((o) => o.orderStatus === "preparing").length,
      "Ready to Serve": list.filter((o) => o.orderStatus === "ready").length,
      "Bill Generated": list.filter((o) => o.paymentStatus === "paid" && o.orderStatus !== "completed").length,
      Completed: list.filter((o) => o.orderStatus === "completed").length,
      Delayed: list.filter(isDelayed).length,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    return (orders ?? []).filter((o) => {
      const matchesTab =
        tab === "All Orders" || (tab === "Delayed" ? isDelayed(o) : bucketOf(o) === tab);
      const matchesSearch =
        !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.items.some((i) => i.title.toLowerCase().includes(search.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [orders, tab, search]);

  const dineIn = filtered.filter((o) => channelOf(o) === "dine-in");
  const online = filtered.filter((o) => channelOf(o) === "online");

  if (error && !orders) {
    return (
      <DashboardLayout profile={MANAGER_PROFILE}>
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </DashboardLayout>
    );
  }
  if (!orders) {
    return (
      <DashboardLayout profile={MANAGER_PROFILE}>
        <p className="text-muted-foreground">Loading orders…</p>
      </DashboardLayout>
    );
  }

  const PILLS = [
    ["All Orders", counts["All Orders"]],
    ["New Orders", counts.New],
    ["Preparing", counts.Preparing],
    ["Ready to Serve", counts["Ready to Serve"]],
    ["Bill Generated", counts["Bill Generated"]],
    ["Completed", counts.Completed],
    ["Delayed", counts.Delayed],
  ];

  return (
    <DashboardLayout profile={MANAGER_PROFILE}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Orders</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage all incoming restaurant orders.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Order ID, Customer..." className="w-64 pl-9" />
        </div>
      </div>

      {/* Kitchen alerts — chef reported items unavailable (PRD §12.3) */}
      {alerts.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-[#FFE0B2] bg-[#FFF6F1] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-[#9a3412]">
            <AlertTriangle className="h-4 w-4" /> Kitchen Alerts
          </p>
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm">
                <Ban className="h-4 w-4 text-brand-maroon" />
                Chef reported <span className="font-semibold">{a.item}</span> unavailable
                {a.table ? <span className="text-muted-foreground"> · Table {a.table}</span> : null}
              </span>
              <button
                type="button"
                onClick={() => resolveAlert(a)}
                className="rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-orange/90"
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Stat pills */}
      <section className="flex flex-wrap gap-3">
        {PILLS.map(([label, value]) => (
          <Pill
            key={label}
            label={label}
            value={value}
            active={tab === (label === "New Orders" ? "New" : label)}
            onClick={() => setTab(label === "New Orders" ? "New" : label)}
          />
        ))}
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-brand-cream/60 pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-3 pb-2 text-sm font-medium transition-colors",
              tab === t ? "border-brand-orange font-bold text-brand-orange" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dine-in */}
      <div>
        <h2 className="mb-2 text-base font-bold">Dine-in Orders</h2>
        <Card>
          <CardContent className="p-0">
            <OrdersTable orders={dineIn} onView={setSelected} />
          </CardContent>
        </Card>
      </div>

      {/* Online */}
      <div>
        <h2 className="mb-2 text-base font-bold">Online Orders</h2>
        <Card>
          <CardContent className="p-0">
            <OrdersTable orders={online} onView={setSelected} />
          </CardContent>
        </Card>
      </div>

      {/* Slide-over detail / bill drawer */}
      {selected ? (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-cream/60 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold">Order #ORD-{selected.id.slice(-4)}</h3>
                <p className="text-xs text-muted-foreground">
                  {selected.tableNumber ? `Table ${selected.tableNumber} · Dine-in` : "Online order"} · {formatTime(selected.time)}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="flex gap-2">
                <Badge variant={statusVariant(selected.orderStatus)} className="capitalize">{selected.orderStatus}</Badge>
                <Badge variant={selected.paymentStatus === "paid" ? "ok" : "muted"} className="capitalize">
                  {selected.paymentStatus === "paid" ? "Bill Generated" : "Unpaid"}
                </Badge>
              </div>

              <div className="rounded-xl border border-brand-cream/70">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-brand-cream/50 px-4 py-3 last:border-0">
                    <div>
                      <p className="text-sm font-semibold">{item.quantity}× {item.title}</p>
                      {item.instructions ? (
                        <p className="text-xs text-brand-orange">“{item.instructions}”</p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-brand-cream/60 pt-3 text-base font-bold">
                <span>Total</span>
                <span className="text-brand-red">{formatPrice(orderTotal(selected))}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-brand-cream/60 px-6 py-4">
              {NEXT_STEP[selected.orderStatus] ? (
                <Button onClick={() => advance(selected)} className="w-full bg-brand-orange text-white hover:bg-brand-orange/90">
                  {NEXT_STEP[selected.orderStatus].label}
                </Button>
              ) : null}
              {selected.paymentStatus !== "paid" ? (
                <Button onClick={() => markPaid(selected)} variant="outline" className="w-full">
                  Generate Bill (Mark Paid)
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
