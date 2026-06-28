// Manager · Table Management (/manager/tables) — PRD §16.1. Floor view with live
// status, table-wise active orders, add/edit, status changes, waiter assignment,
// and activate/deactivate (TBL-01/02/03/05/06).

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MANAGER_PROFILE = { restaurantName: "Saffron Kitchen", userName: "Alex Mercy", role: "Manager" };

const STATUSES = ["available", "occupied", "preparing", "served", "cleaning", "inactive"];

const STATUS_TONE = {
  available: "bg-[#E8F5EC] text-[#2E7D32] border-[#BFE3C8]",
  occupied: "bg-[#E7F0FB] text-[#1565C0] border-[#C7DBF3]",
  preparing: "bg-[#FFF3E0] text-[#D9480F] border-[#FAD9BE]",
  served: "bg-[#EDE7F6] text-[#5E35B1] border-[#D6C9EE]",
  cleaning: "bg-[#FFF8E1] text-[#A06D00] border-[#F1E0A8]",
  inactive: "bg-[#F3F4F6] text-[#5F5F5F] border-[#E2E2E2]",
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

const WAITERS = ["Unassigned", "Sunil Verma", "Anita Desai", "Ravi Kumar"];

export default function ManagerTables() {
  const [tables, setTables] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ number: "", seats: "4" });

  function load() {
    requestJson("/manager/tables")
      .then((payload) => setTables(payload.data.tables))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 6000);
    return () => window.clearInterval(id);
  }, []);

  async function patch(id, body) {
    try {
      await requestJson(`/manager/tables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addTable(event) {
    event.preventDefault();
    if (!form.number.trim()) return;
    try {
      await requestJson("/manager/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ number: "", seats: "4" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    setTables((cur) => cur.filter((t) => t.id !== id));
    try {
      await requestJson(`/manager/tables/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const summary = useMemo(() => {
    const list = tables ?? [];
    return STATUSES.map((s) => ({ status: s, count: list.filter((t) => t.status === s).length }));
  }, [tables]);

  return (
    <DashboardLayout profile={MANAGER_PROFILE}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Table Management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor floor status, active orders, and table availability in real time.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      {/* Occupancy summary */}
      <section className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {summary.map((s) => (
          <Card key={s.status}>
            <CardContent className="p-4">
              <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold capitalize", STATUS_TONE[s.status])}>
                {s.status}
              </span>
              <strong className="mt-2 block text-2xl font-bold leading-none">{s.count}</strong>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Add table */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-3" onSubmit={addTable}>
            <div className="space-y-1.5">
              <Label>Table Number</Label>
              <Input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} placeholder="16" className="w-32" />
            </div>
            <div className="space-y-1.5">
              <Label>Seats</Label>
              <Input type="number" min="1" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} className="w-24" />
            </div>
            <Button type="submit" className="gap-2 bg-brand-gradient text-white hover:brightness-105">
              <Plus className="h-4 w-4" /> Add Table
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Floor grid */}
      {!tables ? (
        <p className="text-sm text-muted-foreground">Loading tables…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((t) => (
            <Card key={t.id} className={cn(!t.active && "opacity-70")}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold">{t.number}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {t.seats} seats
                    </p>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize", STATUS_TONE[t.status])}>
                    {t.status}
                  </span>
                </div>

                {t.activeOrder ? (
                  <div className="rounded-lg bg-[#FCFAF7] px-3 py-2 text-xs">
                    <span className="font-semibold">#{t.activeOrder.id.slice(-4)}</span> ·{" "}
                    {t.activeOrder.items} items · {formatPrice(t.activeOrder.total)}
                    <span className="ml-1 capitalize text-muted-foreground">({t.activeOrder.status})</span>
                  </div>
                ) : (
                  <div className="rounded-lg bg-[#FCFAF7] px-3 py-2 text-xs text-muted-foreground">No active order</div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Status</Label>
                    <Select value={t.status} onValueChange={(v) => patch(t.id, { status: v })} disabled={!t.active}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.filter((s) => s !== "inactive").map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Waiter</Label>
                    <Select
                      value={t.waiter || "Unassigned"}
                      onValueChange={(v) => patch(t.id, { waiter: v === "Unassigned" ? "" : v })}
                      disabled={!t.active}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WAITERS.map((w) => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-brand-cream/60 pt-2">
                  <button
                    type="button"
                    onClick={() => patch(t.id, { active: !t.active })}
                    className={cn("text-xs font-semibold", t.active ? "text-brand-maroon" : "text-brand-green")}
                  >
                    {t.active ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" onClick={() => remove(t.id)} className="text-muted-foreground hover:text-brand-maroon" aria-label="Delete table">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
