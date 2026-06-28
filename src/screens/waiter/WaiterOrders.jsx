import { useStaffAuth } from "@/context/StaffAuthContext";
import { useWaiterSessions } from "@/hooks/staff/useWaiter";
import { staffApi } from "@/api/staff.api";
import { useQueryClient } from "@tanstack/react-query";
import { waiterKeys } from "@/hooks/staff/useWaiter";
import { cn } from "@/lib/utils";
import WaiterLayout, { WaiterPageHeader, formatPrice } from "./WaiterLayout";

function statusTone(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "ready" || s === "preparing") return "bg-[#FFF3E0] text-[#D9480F]";
  if (s === "served" || s === "completed") return "bg-[#E8F5EC] text-brand-green";
  return "bg-[#F3F4F6] text-[#5F5F5F]";
}

export default function WaiterOrders() {
  const { staff } = useStaffAuth();
  const qc = useQueryClient();
  const restaurantId = staff?.restaurantId;
  const { data: sessions = [], isLoading, isError } = useWaiterSessions(restaurantId);

  async function markServed(orderId) {
    try {
      await staffApi.updateOrderStatus(restaurantId, orderId, "served");
      qc.invalidateQueries({ queryKey: waiterKeys.sessions(restaurantId) });
    } catch { /* handled silently */ }
  }

  // Flatten sessions into a table-grouped view
  const tables = sessions.map((s) => {
    const itemSummary = (s.orders ?? [])
      .flatMap((o) => o.items ?? [])
      .slice(0, 3)
      .map((i) => `${i.quantity ?? 1}x ${i.name ?? i.menuItem?.name ?? "Item"}`)
      .join(", ");
    const total = (s.orders ?? []).reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    return {
      _id:     s._id,
      table:   s.table?.number ?? s.tableNumber ?? "—",
      status:  s.status ?? s.orders?.[0]?.orderStatus ?? "new",
      items:   itemSummary,
      total,
      orderId: s.orders?.[0]?._id,
    };
  });

  return (
    <WaiterLayout>
      <WaiterPageHeader
        title="Active Orders"
        subtitle="Track table orders and mark them served once delivered."
      />

      <div className="px-4 py-5 sm:px-5">
        {isError && <p className="mb-4 text-sm text-brand-maroon">Failed to load orders.</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isLoading ? (
            <p className="col-span-2 text-sm text-muted-foreground">Loading orders…</p>
          ) : tables.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-brand-cream/60 bg-white py-14 text-center text-sm text-muted-foreground">
              No active orders.
            </div>
          ) : (
            tables.map((row) => (
              <div key={row._id} className="rounded-2xl border border-brand-cream/60 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {row.table === "—" ? "Counter" : `Table T-${row.table}`}
                  </span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusTone(row.status))}>
                    {row.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{row.items}</p>
                <div className="mt-4 flex items-center justify-between border-t border-brand-cream/60 pt-3">
                  <span className="font-bold text-brand-red">{formatPrice(row.total)}</span>
                  <button
                    type="button"
                    onClick={() => row.orderId && markServed(row.orderId)}
                    disabled={!row.orderId}
                    className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange/90 disabled:opacity-50"
                  >
                    Mark Served
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </WaiterLayout>
  );
}
