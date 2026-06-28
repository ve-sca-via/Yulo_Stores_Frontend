// Offer Monitoring (/admin/offers) — PRD §14.2 ADM-07. Monitor offers across
// restaurants and disable invalid/abusive ones (e.g. an over-limit discount).

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { requestJson } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "./AdminLayout";

const STATUS_VARIANT = { active: "ok", flagged: "warn", expired: "muted", disabled: "danger" };

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function OfferMonitoring() {
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState("");

  function load() {
    requestJson("/admin/offers")
      .then((payload) => setOffers(payload.data.offers))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function disable(offer) {
    setOffers((cur) => cur.map((o) => (o.id === offer.id ? { ...o, status: "disabled" } : o)));
    try {
      await requestJson(`/admin/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disabled" }),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const flagged = (offers ?? []).filter((o) => o.status === "flagged");

  return (
    <AdminLayout title="Offer Monitoring" subtitle="Audit offers across restaurants and disable invalid ones.">
      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      {flagged.length > 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#FFE0B2] bg-[#FFF3E0] px-4 py-3 text-sm text-[#9a3412]">
          <AlertTriangle className="h-4 w-4" />
          {flagged.length} offer{flagged.length > 1 ? "s" : ""} flagged for review (discount exceeds platform limits).
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">Platform Offers</h2>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Offer</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Valid To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(offers ?? []).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="pl-6 font-semibold">{o.title}</TableCell>
                  <TableCell className="text-muted-foreground">{o.restaurant}</TableCell>
                  <TableCell>{o.type}</TableCell>
                  <TableCell className="font-medium">{o.discount}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(o.validTo)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[o.status] ?? "muted"} className="capitalize">{o.status}</Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    {o.status === "active" || o.status === "flagged" ? (
                      <Button size="sm" variant="outline" onClick={() => disable(o)} className="text-brand-maroon">
                        Disable
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {offers && offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No offers.</TableCell>
                </TableRow>
              ) : null}
              {!offers ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
