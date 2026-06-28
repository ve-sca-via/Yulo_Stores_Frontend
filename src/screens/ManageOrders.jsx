import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, X } from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useOwnerOrders } from "@/hooks/owner/useOrders";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All Orders" },
  { value: "new", label: "New" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready To Serve" },
  { value: "bill_generated", label: "Bill Generated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function statusVariant(status) {
  const key = (status ?? "").toLowerCase();
  if (key === "completed" || key === "served") return "ok";
  if (key === "ready") return "info";
  if (key === "preparing" || key === "accepted") return "warn";
  if (key === "new") return "muted";
  if (key === "cancelled" || key === "rejected") return "danger";
  return "muted";
}

function orderTotal(order) {
  return order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatPill({ label, value, tone }) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <strong className={cn("mt-1.5 block text-2xl font-bold", tone)}>{value}</strong>
      </CardContent>
    </Card>
  );
}

// Split items array into batches of `size` for display
function toBatches(items, size = 3) {
  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function BatchStatusLabel({ index, total, orderStatus }) {
  const isLast = index === total - 1;
  const isPrepared = !isLast || orderStatus === "completed" || orderStatus === "served" || orderStatus === "ready";
  return isPrepared ? (
    <span className="text-xs font-semibold text-brand-green">Prepared</span>
  ) : (
    <span className="text-xs font-semibold text-brand-orange">• Preparing</span>
  );
}

function OrderDrawer({ order, onClose, onCancel, onMarkPaid }) {
  const navigate = useNavigate();
  const total = orderTotal(order);
  const batches = order.batches ?? toBatches(order.items);
  const [open, setOpen] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [marking, setMarking] = useState(false);
  const isPaid = order.paymentStatus === "paid";
  const cancelTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  async function handleMarkPaid() {
    if (isPaid || marking) return;
    setMarking(true);
    await onMarkPaid(order._id ?? order.id);
    setMarking(false);
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/10 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-brand-cream/60 px-5 py-4">
          <div>
            <p className="font-bold">Order #{order._id ?? order.id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">
              Table {order.tableNumber} &bull; {order.orderType ?? "Dine-In"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-brand-cream/30 hover:text-[#24190f]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Batches + items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {batches.map((batch, batchIdx) => (
            <div key={batchIdx} className={batchIdx > 0 ? "mt-5" : ""}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Batch {batchIdx + 1}
                </span>
                <BatchStatusLabel
                  index={batchIdx}
                  total={batches.length}
                  orderStatus={order.orderStatus}
                />
              </div>
              <div className="space-y-2">
                {batch.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="font-medium">{item.quantity}x</span>{" "}
                      {item.title}
                    </span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cancellation reason box */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            showReason ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="mx-5 mb-3 rounded-xl border border-brand-cream bg-[#FAFAF8] p-4">
            <p className="mb-3 text-[13px] font-bold tracking-tight text-[#24190f]">Reason for Cancellation</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Write a reason for cancellation… (optional)"
              rows={4}
              className="w-full resize-none rounded-lg border border-brand-cream/60 bg-white px-3 py-2 text-sm leading-relaxed text-[#5a403e] placeholder:text-muted-foreground/50 focus:border-brand-cream focus:outline-none"
            />
            <p className="mt-2 text-[11px] text-muted-foreground/70">{cancelTime}</p>
          </div>
        </div>

        {/* Cancel button */}
        <div className="px-5 pb-3">
          <button
            type="button"
            onClick={() => {
              if (!showReason) {
                setShowReason(true);
              } else {
                onCancel(reason);
              }
            }}
            className={cn(
              "w-full rounded-lg border py-2 text-sm font-medium transition-colors",
              showReason
                ? "border-brand-maroon/40 bg-brand-maroon/5 text-brand-maroon hover:bg-brand-maroon/10"
                : "border-brand-cream text-[#5a403e] hover:border-brand-maroon/30 hover:text-brand-maroon",
            )}
          >
            {showReason ? "Confirm Cancellation" : "Cancel order"}
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-brand-cream/60 px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="text-lg font-bold">{formatPrice(total)}</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleMarkPaid}
              disabled={isPaid || marking}
              className="w-full bg-brand-gradient text-white hover:brightness-105 disabled:opacity-70"
            >
              {isPaid ? "✓ Paid" : marking ? "Processing…" : "Mark as Paid"}
            </Button>
            <button
              type="button"
              onClick={() => navigate(`/bill?orderId=${order._id ?? order.id}`)}
              className="w-full rounded-lg border border-brand-cream py-2 text-sm font-medium text-[#5a403e] hover:bg-brand-cream/20"
            >
              View Bill
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ManageOrders() {
  const { restaurantId } = useOwnerAuth();
  const { data: orders = [], isLoading, isError, refetch } = useOwnerOrders(restaurantId);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Owner view is READ-ONLY — status/payment changes handled by staff via chef/waiter APIs
  function markPaid() {}
  function cancelOrder() {}

  const counts = useMemo(() => {
    const list = orders ?? [];
    return {
      total: list.length,
      new: list.filter((o) => o.orderStatus === "new").length,
      preparing: list.filter((o) => o.orderStatus === "preparing").length,
      ready: list.filter((o) => o.orderStatus === "ready").length,
      completed: list.filter((o) => o.orderStatus === "completed").length,
      billGenerated: list.filter((o) => o.paymentStatus === "paid").length,
    };
  }, [orders]);

  const visible = useMemo(() => {
    const list = orders ?? [];
    if (filter === "all") return list;
    if (filter === "bill_generated") return list.filter((o) => o.paymentStatus === "paid");
    return list.filter((o) => o.orderStatus === filter);
  }, [orders, filter]);

  if (isError) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load orders.</p>
      </DashboardLayout>
    );
  }
  if (!orders) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading orders…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Orders</h1>
          <p className="text-sm text-muted-foreground">
            Monitor live orders and move them through the kitchen workflow.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatPill label="Total Orders" value={counts.total} />
        <StatPill label="New" value={counts.new} tone="text-[#5F5F5F]" />
        <StatPill label="Preparing" value={counts.preparing} tone="text-brand-orange" />
        <StatPill label="Ready" value={counts.ready} tone="text-[#1565C0]" />
        <StatPill label="Completed" value={counts.completed} tone="text-brand-green" />
        <StatPill label="Bill Generated" value={counts.billGenerated} tone="text-brand-maroon" />
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              filter === f.value
                ? "bg-brand-gradient text-white"
                : "border border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Order</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => (
                <TableRow key={order._id ?? order.id}>
                  <TableCell className="pl-6 font-semibold">
                    #{order._id ?? order.id.slice(-6)}
                  </TableCell>
                  <TableCell>{order.tableNumber}</TableCell>
                  <TableCell className="max-w-[260px] text-muted-foreground">
                    {order.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}
                  </TableCell>
                  <TableCell className="font-semibold">{formatPrice(orderTotal(order))}</TableCell>
                  <TableCell className="text-muted-foreground">{formatTime(order.time)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.orderStatus)} className="capitalize">
                      {order.orderStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.paymentStatus === "paid" ? "ok" : "muted"} className="capitalize">
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-full border-0 bg-[#FDEEE8] text-brand-maroon hover:bg-brand-maroon/15 hover:text-brand-maroon focus-visible:ring-0"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No orders in this view.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={(reason) => cancelOrder(selectedOrder, reason)}
          onMarkPaid={markPaid}
        />
      )}
    </DashboardLayout>
  );
}
