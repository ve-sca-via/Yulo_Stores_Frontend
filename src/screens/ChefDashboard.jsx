import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChefHat, Eye, LogOut, X } from "lucide-react";

import { useStaffAuth } from "@/context/StaffAuthContext";
import { useKitchenQueue, useKitchenBoard, useUpdateOrderStatus } from "@/hooks/staff/useKitchen";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/* ── Normalize backend Order → UI shape ──────────────────────────────
   Backend fields: _id, type, tableNumber, items[].name, status,
                   specialInstructions, subtotal
   UI expects:     id, number, table, orderType, items[].title, status,
                   orderStatus, instructions
*/
function normalizeOrder(o) {
  return {
    id:               String(o._id),
    number:           String(o._id).slice(-5),
    table:            o.tableNumber ?? "—",
    orderType:        o.type ?? "dine_in",
    items:            (o.items ?? []).map((i) => ({ ...i, title: i.name })),
    status:           o.status,
    orderStatus:      o.status,
    instructions:     o.specialInstructions ?? "",
    batches:          null,
    estimatedMinutes: null,
    assignedChef:     null,
  };
}

/* ── helpers ── */
function estTime(order) {
  return order.estimatedMinutes ?? (order.items.length > 2 ? 20 : 12);
}

function orderLabel(order) {
  const type = (order.orderType ?? "").toLowerCase();
  if (!order.table || order.table === "—") {
    if (type.includes("takeaway")) return "Takeaway";
    return "Online Order";
  }
  return `Table ${String(order.table).padStart(2, "0")}`;
}

function isTakeaway(order) {
  const t = (order.orderType ?? "").toLowerCase();
  return t.includes("takeaway") || t.includes("delivery");
}

function statusOf(order) {
  return order.status ?? "pending";
}

/* ── Upcoming card ── */
function UpcomingCard({ order, onStart }) {
  const mins = estTime(order);
  const take = isTakeaway(order);
  return (
    <div className="flex flex-col rounded-2xl border border-brand-cream/70 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-brand-cream/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground">
          #{order.number}
        </span>
        <span className={cn("text-[11px] font-bold", mins <= 15 ? "text-brand-orange" : "text-brand-maroon")}>
          {mins} min est.
        </span>
      </div>
      <p className={cn("mb-3 text-base font-bold", take ? "text-brand-orange" : "text-[#24190f]")}>
        {orderLabel(order)}
      </p>
      <div className="mb-4 flex-1 space-y-1.5">
        {order.items.map((item, i) => (
          <p key={i} className="text-sm text-[#5a403e]">
            {item.quantity} x {item.title}
          </p>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onStart(order.id)}
        className="w-full rounded-xl bg-brand-gradient py-2.5 text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
      >
        Start Preparing
      </button>
    </div>
  );
}

function toBatches(items, size = 3) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/* ── Order details drawer ── */
function OrderDetailsDrawer({ order, onClose, onMarkReady }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const batches = order.batches ?? toBatches(order.items);
  const status = statusOf(order);
  const take = isTakeaway(order);
  const tableLabel = (!order.table || order.table === "—")
    ? (take ? "Takeaway" : "Online Order")
    : `Table T-${order.table}`;
  const modeLabel = take ? "Takeaway" : "Dine-In";

  async function handleMarkReady() {
    setBusy(true);
    await onMarkReady(order.id, "ready");
    setBusy(false);
    onClose();
  }

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
          "fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[400px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between border-b border-brand-cream/60 px-6 py-5">
          <div>
            <p className="text-lg font-bold text-[#24190f]">
              Order #{order.number}
            </p>
            <p className="text-sm text-muted-foreground">
              {tableLabel} &bull; {modeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-brand-cream/30 hover:text-[#24190f]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {batches.map((batch, bIdx) => {
            const isLast = bIdx === batches.length - 1;
            const batchDone = !isLast || status === "ready" || status === "delivered";
            return (
              <div key={bIdx}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Batch {bIdx + 1}
                  </p>
                  {batchDone ? (
                    <span className="text-[11px] font-bold text-emerald-600">Prepared</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-brand-orange">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                      Preparing
                    </span>
                  )}
                </div>
                <div className="space-y-2.5">
                  {batch.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between text-sm">
                      <span className="text-[#24190f]">
                        <span className="font-bold">{item.quantity}x</span> {item.title}
                      </span>
                      {item.price != null && (
                        <span className="font-semibold text-[#24190f]">
                          ₹{item.price * item.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {bIdx < batches.length - 1 && (
                  <div className="mt-4 border-b border-brand-cream/50" />
                )}
              </div>
            );
          })}

          {order.instructions && (
            <div className="rounded-2xl border border-brand-orange/20 bg-[#FFF5EE] p-4">
              <div className="mb-2 flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-brand-orange" />
                <p className="text-sm font-bold text-[#24190f]">Special Instructions</p>
              </div>
              <p className="text-sm italic leading-relaxed text-[#5a403e]">
                {order.instructions}
              </p>
            </div>
          )}
        </div>

        {status === "preparing" && (
          <div className="border-t border-brand-cream/60 px-6 py-4">
            <button
              type="button"
              disabled={busy}
              onClick={handleMarkReady}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3.5 text-base font-bold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              <CheckCircle2 className="h-5 w-5" />
              {busy ? "Updating…" : "Mark as Ready"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Board card ── */
function BoardCard({ order, column, onAction, onViewDetails }) {
  const [busy, setBusy] = useState(false);
  const take = isTakeaway(order);
  const cancelled = statusOf(order) === "cancelled";

  async function act(nextStatus) {
    setBusy(true);
    await onAction(order.id, nextStatus);
    setBusy(false);
  }

  return (
    <div className={cn(
      "rounded-2xl border bg-white p-4 shadow-sm transition",
      column === "ready"    && "border-emerald-200",
      column === "preparing" && !cancelled && "border-brand-cream/70",
      cancelled             && "border-red-100 opacity-80",
      column === "done"     && "border-gray-200",
    )}>
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-brand-cream/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground">
          #{order.number}
        </span>
        {column === "ready" && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
            Ready for pickup
          </span>
        )}
        {cancelled && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-maroon">
            Cancelled
          </span>
        )}
      </div>

      <p className={cn("mb-3 font-bold leading-snug", take ? "text-brand-orange" : "text-[#24190f]")}>
        {orderLabel(order)}
      </p>

      <div className="mb-4 space-y-1.5 border-b border-brand-cream/50 pb-3">
        {order.items.map((item, i) => (
          <p key={i} className="text-sm text-[#5a403e]">
            {item.quantity} x {item.title}
          </p>
        ))}
      </div>

      {column === "preparing" && !cancelled && (
        <div className="space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => act("ready")}
            className="w-full rounded-xl bg-brand-gradient py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-60"
          >
            {busy ? "Updating…" : "Mark Ready"}
          </button>
          <button type="button" onClick={() => onViewDetails(order)} className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-muted-foreground hover:text-[#24190f]">
            <Eye className="h-3.5 w-3.5" /> View Details
          </button>
        </div>
      )}

      {column === "preparing" && cancelled && (
        <button type="button" className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-muted-foreground hover:text-[#24190f]">
          <Eye className="h-3.5 w-3.5" /> View Details
        </button>
      )}

      {column === "ready" && (
        <button type="button" onClick={() => onViewDetails(order)} className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-muted-foreground hover:text-[#24190f]">
          <Eye className="h-3.5 w-3.5" /> View Details
        </button>
      )}

      {column === "done" && (
        <p className="py-1 text-center text-sm font-medium text-emerald-600">✓ Order Completed</p>
      )}
    </div>
  );
}

/* ── Orders table ── */
function OrdersTable({ orders }) {
  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-brand-cream/60 bg-white py-10 text-center text-sm text-muted-foreground">
        No orders to display.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-cream/60">
      <div className="min-w-[560px] overflow-hidden rounded-2xl bg-white">
        <div className="grid grid-cols-[1fr_1.2fr_2.5fr_1.5fr_0.6fr] bg-[#FFF5EE] px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Order ID</span>
          <span>Table / Mode</span>
          <span>Items</span>
          <span>Status</span>
          <span>Est.</span>
        </div>
        {orders.map((order, idx) => {
          const take = isTakeaway(order);
          const summary = order.items.map((i) => `${i.quantity}x ${i.title}`).join(", ");
          const duration = estTime(order);
          return (
            <div
              key={order.id}
              className={cn(
                "grid grid-cols-[1fr_1.2fr_2.5fr_1.5fr_0.6fr] items-center px-6 py-4",
                idx > 0 && "border-t border-brand-cream/40",
              )}
            >
              <span className="text-sm font-bold text-[#24190f]">#{order.number}</span>
              <span className={cn("text-sm font-medium", take ? "text-brand-orange" : "text-[#24190f]")}>
                {orderLabel(order)}
              </span>
              <span className="truncate pr-4 text-sm text-muted-foreground">{summary}</span>
              <span className="text-sm capitalize text-[#24190f]">{order.status}</span>
              <span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  {duration} min
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoardColumn({ label, count, accent, bg, children }) {
  return (
    <div className={cn("flex min-h-[320px] flex-col rounded-2xl p-4", bg)}>
      <div className="mb-4 flex items-center gap-2">
        <span className={cn("text-[11px] font-bold uppercase tracking-widest", accent)}>{label}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", accent, "bg-white/60")}>
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

/* ── Main ── */
export default function ChefDashboard() {
  const navigate = useNavigate();
  const { staff, logout } = useStaffAuth();
  const restaurantId = staff?.restaurantId;
  const [viewOrder, setViewOrder] = useState(null);

  async function handleLogout() {
    await logout();
    navigate("/staff/login", { replace: true });
  }

  const { data: rawQueue, isLoading: queueLoading, error: queueErr } = useKitchenQueue(restaurantId);
  const { data: rawBoard, error: boardErr } = useKitchenBoard(restaurantId);
  const { mutate: updateStatus } = useUpdateOrderStatus(restaurantId);

  // Normalize backend data → UI shape
  const upcoming  = (rawQueue ?? []).map(normalizeOrder);
  const preparing = (rawBoard?.preparing ?? []).map(normalizeOrder);
  const ready     = (rawBoard?.ready ?? []).map(normalizeOrder);
  const done      = (rawBoard?.completed ?? []).map(normalizeOrder);
  const ongoing   = [...preparing, ...ready];

  const error = (queueErr ?? boardErr)?.message ?? "";

  function setStatus(orderId, newStatus) {
    updateStatus({ orderId, newStatus });
  }

  return (
    <div className="min-h-screen bg-brand-page font-sans text-[#24190f]">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-cream/60 bg-[#FAFAF8] px-4 py-3 shadow-sm sm:px-8">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 rounded-full bg-brand-dark2" />
          <span className="text-lg font-bold text-brand-red sm:text-xl">Kitchen Display</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar>
            <AvatarFallback className="bg-brand-gradient text-xs font-semibold text-white">
              {(staff?.name ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold">{staff?.name ?? "Chef"}</span>
            <span className="text-xs text-muted-foreground">Chef · {staff?.staffCode ?? ""}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-brand-cream px-3 py-2 text-xs font-bold text-brand-maroon hover:bg-brand-cream/30 sm:ml-4"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] space-y-10 px-4 py-6 sm:px-8 sm:py-8">
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-brand-maroon">{error}</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Upcoming",  value: upcoming.length,  color: "text-brand-orange" },
            { label: "Preparing", value: preparing.length, color: "text-[#D9480F]" },
            { label: "Ready",     value: ready.length,     color: "text-emerald-600" },
            { label: "Completed", value: done.length,      color: "text-[#1565C0]" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-brand-cream/70 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-3xl font-bold", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Orders */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Upcoming Orders</h2>
            {upcoming.length > 0 && (
              <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-bold text-brand-orange">
                {upcoming.length} new
              </span>
            )}
          </div>
          {queueLoading ? (
            <p className="animate-pulse text-sm text-muted-foreground">Loading…</p>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl border border-brand-cream/60 bg-white py-10 text-center text-sm text-muted-foreground">
              No upcoming orders right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {upcoming.map((order) => (
                <UpcomingCard key={order.id} order={order} onStart={(id) => setStatus(id, "preparing")} />
              ))}
            </div>
          )}
        </section>

        {/* Preparation Board */}
        <section>
          <h2 className="mb-4 text-xl font-bold">Preparation Board</h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <BoardColumn label="Preparing" count={preparing.length} accent="text-brand-orange" bg="bg-[#FFF5EE]">
              {preparing.map((o) => (
                <BoardCard key={o.id} order={o} column="preparing" onAction={setStatus} onViewDetails={setViewOrder} />
              ))}
              {preparing.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Nothing in preparation.</p>
              )}
            </BoardColumn>

            <BoardColumn label="Ready" count={ready.length} accent="text-emerald-600" bg="bg-[#EDFAF0]">
              {ready.map((o) => (
                <BoardCard key={o.id} order={o} column="ready" onAction={setStatus} onViewDetails={setViewOrder} />
              ))}
              {ready.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No orders ready.</p>
              )}
            </BoardColumn>

            <BoardColumn label="Done" count={done.length} accent="text-muted-foreground" bg="bg-[#F5F5F5]">
              {done.map((o) => (
                <BoardCard key={o.id} order={o} column="done" onAction={setStatus} onViewDetails={setViewOrder} />
              ))}
              {done.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No completed orders.</p>
              )}
            </BoardColumn>
          </div>
        </section>

        {/* Ongoing Orders table */}
        <section>
          <h2 className="mb-4 text-xl font-bold">Ongoing Orders</h2>
          <OrdersTable orders={ongoing} />
        </section>

        {/* Recent History */}
        <section>
          <h2 className="mb-4 text-xl font-bold">Recent History</h2>
          <OrdersTable orders={done} />
        </section>
      </div>

      {viewOrder && (
        <OrderDetailsDrawer
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onMarkReady={setStatus}
        />
      )}
    </div>
  );
}
