// QR Management (/admin/qr) — PRD §14.2 ADM-06. Platform-level QR control across
// restaurants: generate, activate/deactivate, download, and remove codes scoped
// to a chosen restaurant.

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, QrCode, Trash2 } from "lucide-react";

import { requestJson } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import AdminLayout from "./AdminLayout";

async function downloadQr(code) {
  const filename = (`qr-${code.restaurant}-${code.label}`).replace(/\s+/g, "-").toLowerCase() + ".png";

  if (code.qrImageUrl.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = code.qrImageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  try {
    const res = await fetch(code.qrImageUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(code.qrImageUrl, "_blank");
  }
}

export default function AdminQr() {
  const [codes, setCodes] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ restaurant: "", table: "" });

  function load() {
    requestJson("/admin/qr")
      .then((payload) => setCodes(payload.data.codes))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    requestJson("/admin/restaurants")
      .then((payload) => {
        const names = payload.data.restaurants.map((r) => r.name);
        setRestaurants(names);
        setForm((f) => ({ ...f, restaurant: names[0] ?? "" }));
      })
      .catch(() => {});
  }, []);

  async function generate(event) {
    event.preventDefault();
    if (!form.restaurant || !form.table.trim()) {
      setError("Pick a restaurant and table number");
      return;
    }
    setError("");
    try {
      await requestJson("/admin/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant: form.restaurant, table: `T-${form.table}`, label: `Table ${form.table}` }),
      });
      setForm((f) => ({ ...f, table: "" }));
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(code) {
    setCodes((cur) => cur.map((c) => (c.id === code.id ? { ...c, active: !c.active } : c)));
    try {
      await requestJson(`/admin/qr/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !code.active }),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function remove(code) {
    setCodes((cur) => cur.filter((c) => c.id !== code.id));
    try {
      await requestJson(`/admin/qr/${code.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const restaurantOptions = useMemo(
    () => ["all", ...new Set((codes ?? []).map((c) => c.restaurant))],
    [codes],
  );
  const visible = (codes ?? []).filter((c) => filter === "all" || c.restaurant === filter);

  return (
    <AdminLayout
      title="QR Management"
      subtitle="Generate and control table QR codes across every restaurant."
    >
      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      {/* Generate */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-bold">Generate QR Code</h2>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={generate}>
            <div className="space-y-1.5">
              <Label>Restaurant</Label>
              <Select value={form.restaurant} onValueChange={(v) => setForm((f) => ({ ...f, restaurant: v }))}>
                <SelectTrigger><SelectValue placeholder="Select restaurant" /></SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Table Number</Label>
              <Input value={form.table} onChange={(e) => setForm((f) => ({ ...f, table: e.target.value }))} placeholder="14" />
            </div>
            <Button type="submit" className="gap-2 bg-brand-gradient text-white hover:brightness-105">
              <Plus className="h-4 w-4" /> Generate
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {restaurantOptions.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilter(r)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              filter === r ? "bg-brand-gradient text-white" : "border border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
            )}
          >
            {r === "all" ? "All Restaurants" : r}
          </button>
        ))}
      </div>

      {/* Grid */}
      {!codes ? (
        <p className="text-sm text-muted-foreground">Loading QR codes…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((code) => (
            <Card key={code.id} className={cn(!code.active && "opacity-70")}>
              <CardContent className="space-y-3 p-4">
                <div className="grid place-items-center rounded-xl border border-brand-cream/70 bg-white p-3">
                  <img src={code.qrImageUrl} alt={code.label} className="h-24 w-24" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold">{code.label}</p>
                    <p className="text-xs text-muted-foreground">{code.restaurant} · {code.scans} scans</p>
                  </div>
                  <Badge variant={code.active ? "ok" : "muted"} className="uppercase">
                    {code.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-t border-brand-cream/60 pt-2">
                  <button type="button" onClick={() => downloadQr(code)} className="flex items-center gap-1.5 text-xs font-semibold text-brand-orange">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <div className="flex items-center gap-3">
                    <Switch checked={code.active} onCheckedChange={() => toggle(code)} />
                    <button type="button" onClick={() => remove(code)} className="text-muted-foreground hover:text-brand-maroon" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {visible.length === 0 ? (
            <Card className="sm:col-span-2 xl:col-span-3">
              <CardContent className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                <QrCode className="h-8 w-8" /> No QR codes for this restaurant.
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </AdminLayout>
  );
}
