// Live order status — polls the order and renders a step tracker that mirrors
// the restaurant workflow (PRD §9 lifecycle, §18 NOTIF-03). Reflects the same
// status the owner/chef/waiter advance, so the demo loop is end-to-end.

import { useNavigate, useParams } from "react-router-dom";
import { Check, Clock, XCircle } from "lucide-react";

import { useCustomerOrder } from "@/hooks/customer/useCustomerOrders";
import { cn } from "@/lib/utils";
import CustomerLayout, { formatPrice } from "./CustomerLayout";

const STEPS = [
  { key: "new", label: "Order Placed", note: "We've received your order." },
  { key: "accepted", label: "Accepted", note: "The restaurant accepted your order." },
  { key: "preparing", label: "Preparing", note: "The kitchen is cooking your food." },
  { key: "ready", label: "Ready to Serve", note: "Your food is ready." },
  { key: "served", label: "Served", note: "Enjoy your meal!" },
];

const STEP_INDEX = STEPS.reduce((map, step, i) => ({ ...map, [step.key]: i }), {});

function orderTotal(order) {
  return order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export default function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useCustomerOrder(orderId, { pollInterval: 4000 });

  if (isError) {
    return (
      <CustomerLayout title="Order status" showBack onBack={() => navigate("/order/menu")}>
        <p className="px-5 py-8 text-sm text-muted-foreground">Failed to load order status.</p>
      </CustomerLayout>
    );
  }
  if (isLoading || !order) {
    return (
      <CustomerLayout title="Order status" showBack onBack={() => navigate("/order/menu")}>
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
      </CustomerLayout>
    );
  }

  const cancelled = order.orderStatus === "cancelled" || order.orderStatus === "rejected";
  // "completed" sits past "served" on the tracker.
  const currentIndex =
    order.orderStatus === "completed" ? STEPS.length - 1 : STEP_INDEX[order.orderStatus] ?? 0;

  return (
    <CustomerLayout title="Order status" showBack onBack={() => navigate("/order/menu")}>
      <div className="space-y-5 px-5 py-4">
        <div className="rounded-2xl border border-brand-cream/70 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Order #{(order._id ?? order.id ?? "").slice(-6)}</p>
              <p className="font-semibold capitalize">
                {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold capitalize",
                cancelled ? "bg-[#FCE9E4] text-brand-maroon" : "bg-brand-orange/10 text-brand-orange",
              )}
            >
              {order.orderStatus}
            </span>
          </div>
        </div>

        {cancelled ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-cream/70 bg-white p-8 text-center">
            <XCircle className="h-12 w-12 text-brand-maroon" />
            <p className="font-semibold">This order was {order.orderStatus}.</p>
            <p className="text-sm text-muted-foreground">
              Please contact restaurant staff if you need assistance.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-cream/70 bg-white p-5">
            <ol className="relative space-y-6">
              {STEPS.map((step, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                return (
                  <li key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-full border-2 transition-colors",
                          done && "border-brand-green bg-brand-green text-white",
                          active && "border-brand-orange bg-brand-orange/10 text-brand-orange",
                          !done && !active && "border-brand-cream text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : active ? <Clock className="h-4 w-4" /> : i + 1}
                      </span>
                      {i < STEPS.length - 1 ? (
                        <span className={cn("mt-1 h-8 w-0.5", done ? "bg-brand-green" : "bg-brand-cream")} />
                      ) : null}
                    </div>
                    <div className="pt-1">
                      <p className={cn("font-semibold", active && "text-brand-orange")}>{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.note}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl border border-brand-cream/70 bg-white p-4">
          <p className="mb-3 text-sm font-semibold">Order summary</p>
          <div className="space-y-2">
            {(order.items ?? []).map((item, idx) => (
              <div key={item._id ?? item.recipeId ?? idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}× {item.name ?? item.menuItem?.name ?? item.title}
                </span>
                <span className="font-medium">{formatPrice((item.price ?? 0) * (item.quantity ?? 1))}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-brand-cream/60 pt-3 font-bold">
            <span>Total</span>
            <span className="text-brand-red">{formatPrice(orderTotal(order))}</span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">Status refreshes automatically.</p>
      </div>
    </CustomerLayout>
  );
}
