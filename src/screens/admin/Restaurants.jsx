// Restaurant Management (/admin/restaurants) — PRD §14.2 ADM-01/02. Add, search,
// activate/deactivate restaurants and see owner mapping. Deactivation keeps the
// record (PRD §14.3 — no destructive delete).

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { requestJson } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout, { formatNumber } from "./AdminLayout";

const EMPTY = { name: "", owner: "", city: "", plan: "Starter" };

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  function load() {
    requestJson("/admin/restaurants")
      .then((payload) => setRestaurants(payload.data.restaurants))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function toggle(restaurant) {
    const next = restaurant.status === "active" ? "inactive" : "active";
    setRestaurants((cur) => cur.map((r) => (r.id === restaurant.id ? { ...r, status: next } : r)));
    try {
      await requestJson(`/admin/restaurants/${restaurant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function add(event) {
    event.preventDefault();
    try {
      await requestJson("/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = useMemo(
    () =>
      (restaurants ?? []).filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.owner.toLowerCase().includes(search.toLowerCase()) ||
          r.city.toLowerCase().includes(search.toLowerCase()),
      ),
    [restaurants, search],
  );

  return (
    <AdminLayout
      title="Restaurant Management"
      subtitle="Onboard, monitor, activate, and deactivate platform restaurants."
      action={
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2 bg-brand-gradient text-white hover:brightness-105">
          <Plus className="h-4 w-4" /> Add Restaurant
        </Button>
      }
    >
      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      {showForm ? (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Add Restaurant</h2>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" onSubmit={add}>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder="Assign owner" />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <Button type="submit" className="bg-brand-orange text-white hover:bg-brand-orange/90">
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <h2 className="text-base font-bold">All Restaurants</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-56 pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Restaurant</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-6 font-semibold">{r.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{r.owner}</div>
                    <div className="text-xs text-muted-foreground">{r.ownerEmail}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.city}</TableCell>
                  <TableCell>
                    <Badge variant={r.plan === "Pro" ? "info" : "muted"}>{r.plan}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatNumber(r.orders)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "active" ? "ok" : "muted"} className="capitalize">{r.status}</Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Switch checked={r.status === "active"} onCheckedChange={() => toggle(r)} />
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {restaurants ? "No restaurants match your search." : "Loading…"}
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
