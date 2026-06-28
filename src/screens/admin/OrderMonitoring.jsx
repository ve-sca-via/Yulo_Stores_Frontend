// Order Monitoring (/admin/orders) — PRD §14.2 ADM-05. Cross-restaurant order
// feed with restaurant/status filters and search.

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { requestJson } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout, { formatPrice } from "./AdminLayout";

function statusVariant(status) {
  const k = status.toLowerCase();
  if (k === "completed") return "ok";
  if (k === "ready") return "info";
  if (k === "preparing") return "warn";
  if (k === "cancelled") return "danger";
  return "muted";
}

function formatTime(value) {
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function OrderMonitoring() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [restaurant, setRestaurant] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    requestJson("/admin/orders")
      .then((payload) => setOrders(payload.data.orders))
      .catch((err) => setError(err.message));
  }, []);

  const restaurants = useMemo(() => ["all", ...new Set((orders ?? []).map((o) => o.restaurant))], [orders]);
  const statuses = useMemo(() => ["all", ...new Set((orders ?? []).map((o) => o.status))], [orders]);

  const visible = useMemo(
    () =>
      (orders ?? []).filter((o) => {
        const matchesR = restaurant === "all" || o.restaurant === restaurant;
        const matchesS = status === "all" || o.status === status;
        const matchesQ =
          !search ||
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.customer.toLowerCase().includes(search.toLowerCase());
        return matchesR && matchesS && matchesQ;
      }),
    [orders, restaurant, status, search],
  );

  return (
    <AdminLayout title="Order Monitoring" subtitle="Track orders across every restaurant on the platform.">
      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order or customer…" className="w-60 pl-9" />
        </div>
        <Select value={restaurant} onValueChange={setRestaurant}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {restaurants.map((r) => (
              <SelectItem key={r} value={r}>{r === "all" ? "All Restaurants" : r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All Status" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">{visible.length} orders</h2>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Order</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="pl-6 font-semibold">#{o.id.slice(-4).toUpperCase()}</TableCell>
                  <TableCell>{o.restaurant}</TableCell>
                  <TableCell className="text-muted-foreground">{o.customer}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(o.amount)}</TableCell>
                  <TableCell><Badge variant={statusVariant(o.status)} className="capitalize">{o.status}</Badge></TableCell>
                  <TableCell className="pr-6 text-muted-foreground">{formatTime(o.time)}</TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {orders ? "No orders match your filters." : "Loading…"}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
