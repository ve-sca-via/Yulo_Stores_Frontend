import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  flexRender, getCoreRowModel, useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Flame, MoreHorizontal, Star, TrendingUp } from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import {
  useDashboardKPIs,
  useSalesChart,
  useTopItems,
  useRecentOrders,
} from "@/hooks/owner/useDashboard";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ── Helpers ──────────────────────────────────────────────────────────
function statusVariant(status) {
  const key = (status ?? "").toLowerCase();
  if (key.includes("paid") || key.includes("delivered")) return "ok";
  if (key.includes("ready")) return "info";
  if (key.includes("prepar") || key.includes("way")) return "warn";
  if (key.includes("pending")) return "muted";
  if (key.includes("cancel")) return "danger";
  return "muted";
}

const PERIODS = ["Today", "This Week", "This Month"];
const PERIOD_PARAM = { Today: "today", "This Week": "week", "This Month": "month" };

const BREAKDOWN_COLORS = {
  delivered:    "#2E7D32",
  preparing:    "#D9480F",
  "on the way": "#F2A65A",
  cancelled:    "#B11226",
};

function PeriodDropdown({ value, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg border-brand-cream/70 text-[13px] font-normal text-[#5f5f5f] hover:bg-[#f5ede4] hover:text-[#24190f] focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {value}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PERIODS.map((p) => (
          <DropdownMenuItem key={p} onClick={() => onChange(p)}>{p}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatCard({ title, value, delta, caption, up, stars }) {
  return (
    <Card>
      <CardContent className="p-[18px]">
        <span className="text-[13px] text-muted-foreground">{title}</span>
        <strong className="mt-2.5 block text-[28px] font-bold leading-none">{value ?? "—"}</strong>
        {stars && (
          <div className="mt-2 flex gap-0.5 text-brand-saffron">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
        )}
        {delta ? (
          <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${up ? "text-brand-green" : "text-muted-foreground"}`}>
            <TrendingUp className="h-3.5 w-3.5" />
            {delta}
          </div>
        ) : (
          <div className="mt-1.5 text-xs text-muted-foreground">{caption}</div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHead({ title, action }) {
  return (
    <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
      <h2 className="text-base font-bold">{title}</h2>
      {action}
    </CardHeader>
  );
}

function SkeletonCard() {
  return <div className="h-24 animate-pulse rounded-2xl bg-brand-cream/40" />;
}

// ── Main ─────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, restaurantId } = useOwnerAuth();

  const [salesPeriod, setSalesPeriod]         = useState("This Week");
  const [breakdownPeriod, setBreakdownPeriod] = useState("Today");
  const [hoveredSegment, setHoveredSegment]   = useState(null);

  const { data: kpis,          isLoading: kpisLoading }  = useDashboardKPIs(restaurantId);
  const { data: salesChart,    isLoading: salesLoading }  = useSalesChart(restaurantId, PERIOD_PARAM[salesPeriod]);
  const { data: topItems,      isLoading: topLoading }    = useTopItems(restaurantId);
  const { data: recentOrders,  isLoading: ordersLoading } = useRecentOrders(restaurantId);

  const columns = useMemo(() => [
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: (c) => <span className="font-semibold">#{c.getValue()}</span>,
    },
    {
      id: "items",
      header: "Items",
      cell: (c) => {
        const items = c.row.original.items ?? [];
        return <span>{items.map((i) => `${i.quantity}x ${i.name ?? i.title}`).join(", ") || "—"}</span>;
      },
    },
    {
      accessorKey: "orderStatus",
      header: "Status",
      cell: (c) => <Badge variant={statusVariant(c.getValue())}>{c.getValue()}</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: "Time",
      cell: (c) => {
        const raw = c.getValue();
        return (
          <span className="text-muted-foreground">
            {raw ? new Date(raw).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => <MoreHorizontal className="h-4 w-4 text-muted-foreground" />,
    },
  ], []);

  const tableInstance = useReactTable({
    data: recentOrders ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ── No restaurant ─────────────────────────────────────────────────
  if (!restaurantId && !kpisLoading) {
    return (
      <DashboardLayout profile={user}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="mb-2 text-xl font-bold text-[#24190f]">No restaurant found</p>
          <p className="mb-6 text-sm text-muted-foreground">
            You haven&apos;t set up a restaurant yet.
          </p>
          <button
            type="button"
            onClick={() => navigate("/store-settings")}
            className="rounded-2xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white hover:brightness-105"
          >
            Create Restaurant
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const breakdownSegments = kpis?.orderBreakdown
    ? Object.entries(kpis.orderBreakdown).map(([label, value]) => ({
        label,
        value,
        percent: kpis.total ? Math.round((value / kpis.total) * 100) : 0,
        color: BREAKDOWN_COLORS[label.toLowerCase()] ?? "#94a3b8",
      }))
    : [];

  return (
    <DashboardLayout profile={user}>
      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Orders"
              value={kpis?.totalOrders?.value}
              delta={kpis?.totalOrders?.delta}
              up={kpis?.totalOrders?.up}
            />
            <StatCard
              title="Revenue"
              value={kpis?.revenue?.value}
              delta={kpis?.revenue?.delta}
              up={kpis?.revenue?.up}
            />
            <StatCard
              title="Live Tables"
              value={kpis?.liveMonitoring?.value}
              caption={kpis?.liveMonitoring?.caption ?? "active tables"}
            />
            <StatCard
              title="Average Rating"
              value={kpis?.averageRating?.value}
              caption={kpis?.averageRating?.caption}
              stars
            />
          </>
        )}
      </section>

      {/* Sales + Breakdown */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionHead
            title="Sales Overview"
            action={<PeriodDropdown value={salesPeriod} onChange={setSalesPeriod} />}
          />
          <CardContent>
            {salesLoading ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground animate-pulse">Loading…</div>
            ) : (salesChart ?? []).length === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={salesChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D9480F" />
                      <stop offset="100%" stopColor="#A4161A" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8a8a8a" }} />
                  <YAxis
                    tickLine={false} axisLine={false}
                    tick={{ fontSize: 11, fill: "#8a8a8a" }}
                    tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(217,72,15,0.06)" }}
                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Sales"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #EFE7DD", fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="url(#barFill)" radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <SectionHead
            title="Order Breakdown"
            action={<PeriodDropdown value={breakdownPeriod} onChange={setBreakdownPeriod} />}
          />
          <CardContent>
            {breakdownSegments.length > 0 ? (
              <>
                <div className="relative mx-auto h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdownSegments}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={58} outerRadius={88}
                        paddingAngle={2} startAngle={90} endAngle={-270}
                        stroke="none"
                        onMouseEnter={(_, i) => setHoveredSegment(breakdownSegments[i])}
                        onMouseLeave={() => setHoveredSegment(null)}
                      >
                        {breakdownSegments.map((s) => <Cell key={s.label} fill={s.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-all">
                    {hoveredSegment ? (
                      <>
                        <strong className="text-2xl font-bold" style={{ color: hoveredSegment.color }}>
                          {hoveredSegment.value}
                        </strong>
                        <span className="max-w-[80px] text-center text-[10px] leading-tight text-muted-foreground">
                          {hoveredSegment.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <strong className="text-2xl font-bold">
                          {breakdownSegments.reduce((s, i) => s + i.value, 0)}
                        </strong>
                        <span className="text-[11px] text-muted-foreground">Total Orders</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="mb-3 mt-1 text-[13px] font-semibold">Order Status Breakdown</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {breakdownSegments.map((s) => (
                    <div key={s.label} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="ml-auto font-semibold">{s.value} ({s.percent}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                {kpisLoading ? "Loading…" : "No breakdown data."}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Live Kitchen Activity */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Flame className="h-4 w-4 text-brand-orange" /> Live Kitchen Activity
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage active orders and preparation queue
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="text-[13px] font-semibold text-brand-orange"
          >
            View All Orders →
          </button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {tableInstance.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-brand-cream/60">
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {ordersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                    Loading orders…
                  </TableCell>
                </TableRow>
              ) : tableInstance.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No recent orders.
                  </TableCell>
                </TableRow>
              ) : (
                tableInstance.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Selling + Recent Orders */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionHead title="Top Selling Items" />
          <CardContent>
            {topLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">Loading…</div>
            ) : (topItems ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              (topItems ?? []).map((item, i) => (
                <div
                  key={`${item.name ?? item._id}-${i}`}
                  className="flex items-center gap-3 border-b border-[#F6EFE9] py-3 last:border-0"
                >
                  <span className="h-11 w-11 shrink-0 rounded-[10px] bg-gradient-to-br from-brand-saffron to-brand-red" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.totalOrders ?? item.orders} orders
                    </span>
                  </div>
                  <span className="ml-auto font-bold text-[#24190F]">₹{item.price ?? "—"}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <SectionHead
            title="Recent Orders"
            action={
              <button
                type="button"
                className="text-[13px] font-semibold text-brand-orange"
                onClick={() => navigate("/orders")}
              >
                View All Orders
              </button>
            }
          />
          <CardContent>
            {ordersLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">Loading…</div>
            ) : (recentOrders ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No recent orders.</p>
            ) : (
              (recentOrders ?? []).map((order) => (
                <div
                  key={order._id ?? order.id}
                  className="flex items-center justify-between gap-3 border-b border-[#F6EFE9] py-3.5 last:border-0"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold">
                        #{order.orderNumber ?? order._id?.slice(-5)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(order.items ?? []).map((i) => `${i.quantity}x ${i.name ?? i.title}`).join(", ")}
                    </span>
                  </div>
                  <Badge variant={statusVariant(order.orderStatus ?? order.status)}>
                    {order.orderStatus ?? order.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </DashboardLayout>
  );
}
