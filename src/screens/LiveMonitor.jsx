import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useLiveStats, useLiveVisitors, useLiveRepeat } from "@/hooks/owner/useLiveMonitor";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatCard({ title, value, sub }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-3xl font-bold">{value ?? "—"}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function LiveMonitor() {
  const { restaurantId } = useOwnerAuth();

  const { data: stats,    isLoading: statsLoading }    = useLiveStats(restaurantId);
  const { data: visitors, isLoading: visitorsLoading } = useLiveVisitors(restaurantId);
  const { data: repeat,   isLoading: repeatLoading }   = useLiveRepeat(restaurantId);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Visitors Analysis</h1>
        <p className="text-sm text-muted-foreground">Live data — refreshes every 30 seconds.</p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-brand-cream/40" />
          ))
        ) : (
          <>
            <StatCard title="Active Tables"   value={stats?.activeTables ?? 0} />
            <StatCard title="Active Orders"   value={stats?.activeOrders ?? 0} />
            <StatCard title="Today's Revenue" value={stats?.todayRevenue != null ? `₹${stats.todayRevenue}` : "—"} />
            <StatCard title="Avg Order Value" value={stats?.avgOrderValue != null ? `₹${stats.avgOrderValue}` : "—"} />
          </>
        )}
      </section>

      {/* Active visitors */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-bold">Active Visitors</h2>
        </CardHeader>
        <CardContent>
          {visitorsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !visitors?.tables?.length ? (
            <p className="text-sm text-muted-foreground">No active visitors right now.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visitors.tables.map((t) => (
                <div
                  key={t.tableId ?? t.identifier}
                  className="flex items-center justify-between rounded-xl border border-brand-cream/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">Table {t.identifier ?? t.tableId}</p>
                    <p className="text-xs text-muted-foreground">{t.guestCount ?? 0} guests</p>
                  </div>
                  <Badge variant="ok">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repeat visitors */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-bold">Repeat Visitors</h2>
        </CardHeader>
        <CardContent>
          {repeatLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !repeat?.visitors?.length ? (
            <p className="text-sm text-muted-foreground">No repeat visitor data yet.</p>
          ) : (
            <div className="divide-y divide-brand-cream/40">
              {repeat.visitors.map((v, i) => (
                <div key={v._id ?? i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold">{v.name ?? v.email ?? "Guest"}</p>
                    <p className="text-xs text-muted-foreground">{v.email}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-orange">{v.visitCount ?? v.count ?? 0} visits</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
