// Platform Dashboard (/admin) — PRD §14.1. Platform-wide totals, system health,
// recent restaurant onboarding, and recent platform activity.

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Store,
  Tag,
  Users,
  Utensils,
} from "lucide-react";

import { requestJson } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import AdminLayout, { formatNumber } from "./AdminLayout";

const STAT_META = [
  { key: "totalRestaurants", label: "Total Restaurants", icon: Store },
  { key: "activeRestaurants", label: "Active", icon: CheckCircle2 },
  { key: "inactiveRestaurants", label: "Inactive", icon: Store },
  { key: "totalCustomers", label: "Total Customers", icon: Users },
  { key: "totalOrders", label: "Total Orders", icon: Utensils },
  { key: "activeOffers", label: "Active Offers", icon: Tag },
];

function healthTone(status) {
  if (status === "operational") return "bg-[#E8F5EC] text-brand-green";
  if (status === "degraded") return "bg-[#FFF3E0] text-[#D9480F]";
  return "bg-[#FCE9E4] text-brand-maroon";
}

function timeAgo(value) {
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson("/admin/dashboard")
      .then((payload) => setData(payload.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error && !data) {
    return (
      <AdminLayout title="Platform Dashboard">
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </AdminLayout>
    );
  }
  if (!data) {
    return (
      <AdminLayout title="Platform Dashboard">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Platform Dashboard"
      subtitle="Monitor restaurants, customers, and overall platform health."
    >
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {STAT_META.map((meta) => {
          const Icon = meta.icon;
          return (
            <Card key={meta.key}>
              <CardContent className="p-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-orange/10 text-brand-orange">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <strong className="mt-3 block text-2xl font-bold leading-none">
                  {formatNumber(data.stats[meta.key])}
                </strong>
                <span className="mt-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
                  {meta.label}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* System health */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-bold">System Health</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.health.map((h) => (
            <div key={h.name} className="flex items-center justify-between rounded-xl border border-brand-cream/70 px-4 py-3">
              <span className="text-sm font-medium">{h.name}</span>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", healthTone(h.status))}>
                {h.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent restaurants */}
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Recent Restaurants</h2>
          </CardHeader>
          <CardContent>
            {data.recentRestaurants.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-[#F6EFE9] py-3 last:border-0">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.owner} · {r.city}</p>
                </div>
                <Badge variant={r.status === "active" ? "ok" : "muted"} className="capitalize">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
            <Activity className="h-4 w-4 text-brand-orange" />
            <h2 className="text-base font-bold">Recent Platform Activity</h2>
          </CardHeader>
          <CardContent>
            {data.recentActivity.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 border-b border-[#F6EFE9] py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.entity} · {a.user}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.time)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AdminLayout>
  );
}
