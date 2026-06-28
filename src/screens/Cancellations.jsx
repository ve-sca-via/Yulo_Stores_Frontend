import { useEffect, useMemo, useState } from "react"; // useEffect kept for drawer animation
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useOwnerOrders } from "@/hooks/owner/useOrders";
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

const FILTERS = [
  { value: "all", label: "All Orders" },
  { value: "new", label: "New" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready To Serve" },
  { value: "bill_generated", label: "Bill Generated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function paymentVariant(status) {
  if (status === "paid") return "ok";
  if (status === "pending") return "warn";
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

function OrderTypeBadge({ type }) {
  const isDineIn = !type || type === "dine-in";
  return (
    <span
      className={cn(
        "mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-semibold",
        isDineIn
          ? "bg-brand-orange/10 text-brand-orange"
          : "bg-blue-50 text-blue-600",
      )}
    >
      {isDineIn ? "Dine-In" : "Online Delivery"}
    </span>
  );
}

function CancelledTable({ orders, onViewDetails }) {
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No cancelled orders in this category.
      </p>
    );
  }

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
        {orders.map((order) => {
          const preview = order.items.slice(0, 2).map((i) => `${i.quantity}x ${i.title}`).join(", ");
          const extra = order.items.length - 2;
          return (
            <TableRow key={order.id}>
              <TableCell className="pl-6">
                <p className="font-semibold">#{order.id.slice(-7).toUpperCase()}</p>
                <OrderTypeBadge type={order.orderType} />
              </TableCell>
              <TableCell className="max-w-[220px]">
                <p className="text-sm text-[#24190f]">{preview}</p>
                {extra > 0 && (
                  <p className="text-xs text-brand-orange">+{extra} More Items</p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={paymentVariant(order.paymentStatus)} className="uppercase text-[10px]">
                  {order.paymentStatus ?? "unpaid"}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="font-semibold">{formatPrice(orderTotal(order))}</p>
                <p className="text-[10px] text-muted-foreground">Incl. Taxes</p>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 rounded-full border border-brand-maroon/30 bg-brand-maroon/5 px-2.5 py-1 text-xs font-semibold text-brand-maroon">
                  × Cancelled
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatTime(order.time)}</TableCell>
              <TableCell className="pr-6 text-right">
                <Button
                  size="sm"
                  onClick={() => onViewDetails(order)}
                  className="rounded-full border-0 bg-[#FDEEE8] text-brand-maroon hover:bg-brand-maroon/15 hover:text-brand-maroon focus-visible:ring-0"
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-[#24190f]">{value || "—"}</p>
    </div>
  );
}

function CancelledOrderDrawer({ order, onClose }) {
  const [open, setOpen] = useState(false);
  const [couponSent, setCouponSent] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = orderTotal(order);
  const isDineIn = !order.orderType || order.orderType === "dine-in";
  const orderTime = formatTime(order.time);
  const cancelledAt = order.cancelledAt ? formatTime(order.cancelledAt) : "—";

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
        <div className="flex items-start justify-between border-b border-brand-cream/60 px-5 py-4">
          <div>
            <p className="font-bold text-[#24190f]">Cancelled Order Details</p>
            <p className="text-xs text-muted-foreground">
              View cancellation information and customer feedback.
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

        <div className="flex-1 overflow-y-auto">
          {/* Order Information */}
          <div className="border-b border-brand-cream/60 px-5 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Order Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Order Mode" value={isDineIn ? "Dine-In" : "Online Delivery"} />
              <InfoRow label="Customer Name" value={order.customerName ?? "—"} />
              <InfoRow label="Phone" value={order.phone ?? "—"} />
              <InfoRow label="Order Time" value={orderTime} />
              <InfoRow label="Cancelled At" value={cancelledAt} />
              <InfoRow
                label="Delivery Area"
                value={isDineIn ? "Dine-In" : (order.deliveryArea ?? "—")}
              />
            </div>
          </div>

          {/* Cancellation Reason — only for online orders */}
          {!isDineIn && (
            <div className="border-b border-brand-cream/60 px-5 py-4">
              <p className="mb-2 text-sm font-bold text-[#24190f]">Cancellation Reason</p>
              <div className="rounded-xl border border-brand-cream/70 bg-[#FAFAF8] p-3">
                <span className="mb-2 inline-block rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-orange">
                  Online Delivery
                </span>
                <p className="text-sm leading-relaxed text-[#5a403e]">
                  {order.cancellationReason ||
                    "The order was cancelled because the estimated delivery time exceeded the expected delivery window."}
                </p>
              </div>
            </div>
          )}

          {/* Ordered Items */}
          <div className="border-b border-brand-cream/60 px-5 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ordered Items
            </p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-brand-saffron/40 to-brand-orange/30" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#24190f] truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-brand-cream/60 pt-3">
              <span className="text-sm font-semibold text-[#24190f]">Order Total</span>
              <span className="text-base font-bold text-[#24190f]">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Customer Feedback */}
          <div className="border-b border-brand-cream/60 px-5 py-4">
            <p className="mb-2 text-sm font-bold text-[#24190f]">Customer Feedback</p>
            <div className="rounded-xl border border-brand-cream/70 bg-[#FAFAF8] px-3 py-2.5">
              {order.cancellationReason ? (
                <>
                  <p className="text-sm leading-relaxed text-[#5a403e]">
                    "{order.cancellationReason}"
                  </p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">{cancelledAt}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground/60">
                  {isDineIn
                    ? "Description: the reason of cancellation"
                    : "No customer feedback provided."}
                </p>
              )}
            </div>
          </div>

          {/* Retention Actions */}
          <div className="px-5 py-4">
            <p className="mb-1 text-sm font-bold text-[#24190f]">Retention Actions</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Take immediate steps to retain this customer.
            </p>
            <Button
              onClick={() => setCouponSent(true)}
              disabled={couponSent}
              className="w-full bg-brand-gradient text-white hover:brightness-105 disabled:opacity-70"
            >
              {couponSent ? "Coupon Sent ✓" : "Send Coupon"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Cancellations() {
  const navigate = useNavigate();
  const { restaurantId } = useOwnerAuth();
  const { data: orders = [], isLoading, isError } = useOwnerOrders(restaurantId);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("cancelled");
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const cancelledOrders = useMemo(() => {
    const list = (orders ?? []).filter(
      (o) =>
        o.orderStatus === "cancelled" &&
        (search === "" ||
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          (o.tableNumber ?? "").toString().includes(search)),
    );
    return {
      dineIn: list.filter((o) => !o.orderType || o.orderType === "dine-in"),
      online: list.filter((o) => o.orderType && o.orderType !== "dine-in"),
    };
  }, [orders, search]);

  if (isError) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load orders.</p>
      </DashboardLayout>
    );
  }
  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Orders</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage all incoming restaurant orders.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, Customer..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Stat pills */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {[
          { label: "All Orders", value: counts.total },
          { label: "New", value: counts.new, tone: "text-[#5F5F5F]" },
          { label: "Preparing", value: counts.preparing, tone: "text-brand-orange" },
          { label: "Ready To Serve", value: counts.ready, tone: "text-[#1565C0]" },
          { label: "Bill Generated", value: counts.billGenerated, tone: "text-brand-maroon" },
          { label: "Completed", value: counts.completed, tone: "text-brand-green" },
        ].map((pill) => (
          <Card key={pill.label}>
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground">{pill.label}</span>
              <strong className={cn("mt-1.5 block text-2xl font-bold", pill.tone)}>
                {pill.value}
              </strong>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => f.value !== "cancelled" && navigate(f.value === "all" ? "/orders" : `/${f.value === "bill_generated" ? "orders" : f.value}`)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              f.value === "cancelled"
                ? "bg-brand-gradient text-white"
                : "border border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Dine-In Cancelled Orders */}
      <div>
        <h2 className="mb-3 text-base font-bold">Dine-In Cancelled Orders</h2>
        <Card>
          <CardContent className="p-0">
            <CancelledTable
              orders={cancelledOrders.dineIn}
              onViewDetails={(order) => setSelectedOrder(order)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Online Cancelled Orders */}
      <div>
        <h2 className="mb-3 text-base font-bold">Online Cancelled Orders</h2>
        <Card>
          <CardContent className="p-0">
            <CancelledTable
              orders={cancelledOrders.online}
              onViewDetails={(order) => setSelectedOrder(order)}
            />
          </CardContent>
        </Card>
      </div>

      {selectedOrder && (
        <CancelledOrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </DashboardLayout>
  );
}
