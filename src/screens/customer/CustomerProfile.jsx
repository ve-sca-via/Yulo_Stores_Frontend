import { useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, UserRound } from "lucide-react";

import { useCustomerOrders } from "@/hooks/customer/useCustomerOrders";
import { cn } from "@/lib/utils";
import CustomerLayout, { formatPrice } from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";

function orderTotal(order) {
  return (order.items ?? []).reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
}

function statusTone(status) {
  if (status === "completed" || status === "served") return "bg-[#E8F5EC] text-brand-green";
  if (status === "ready")                            return "bg-[#E7F0FB] text-[#1565C0]";
  if (status === "cancelled" || status === "rejected") return "bg-[#FCE9E4] text-brand-maroon";
  return "bg-brand-orange/10 text-brand-orange";
}

function formatWhen(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { auth, session, setSession, clearCart } = useCustomer();
  const { data: orders = [], isLoading, isError } = useCustomerOrders();

  function logout() {
    auth.logout();
    clearCart();
    setSession({ verified: false, name: "", tableNumber: "", orderType: "dine-in" });
    navigate("/order", { replace: true });
  }

  return (
    <CustomerLayout title="Account" showNav activeNav="Account">
      <div className="space-y-5 px-5 py-5">
        {/* Identity */}
        <div className="flex items-center gap-4 rounded-2xl border border-brand-cream/70 bg-white p-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-white">
            <UserRound className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-lg font-bold">{auth.customer?.name ?? session.name ?? "Guest"}</h2>
            <p className="text-sm text-muted-foreground">{auth.customer?.email ?? ""}</p>
          </div>
        </div>

        {/* Order history */}
        <div>
          <h3 className="mb-3 text-base font-bold">Order History</h3>
          {isError && <p className="text-sm text-brand-maroon">Failed to load orders.</p>}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-brand-cream/70 bg-white p-8 text-center text-sm text-muted-foreground">
              No orders yet. Your past orders will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const id = order._id ?? order.id ?? "";
                const preview = (order.items ?? [])
                  .slice(0, 3)
                  .map((i) => `${i.quantity ?? 1}× ${i.name ?? i.menuItem?.name ?? i.title}`)
                  .join(", ");
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigate(`/order/status/${id}`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-brand-cream/70 bg-white p-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">#{id.slice(-6)}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", statusTone(order.orderStatus))}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{preview}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatWhen(order.createdAt ?? order.time)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-brand-red">{formatPrice(order.totalAmount ?? orderTotal(order))}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-cream py-3.5 text-sm font-bold text-brand-maroon"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </CustomerLayout>
  );
}
