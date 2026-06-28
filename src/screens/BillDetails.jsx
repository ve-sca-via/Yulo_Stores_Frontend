// Bill Details (/bill) — Figma node 173:1047. Table-wise billing: order batches,
// a tax/charge payment summary, and a collapsible GST invoice preview. Reached
// from the dashboard kitchen queue / operations command center "View Bill".
// Data from the mock layer: GET /restaurant_owner/bill.

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  Printer,
  Share2,
  Tag,
  User,
} from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useBill } from "@/hooks/owner/useBills";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function BatchCard({ batch }) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-brand-green">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Badge className="bg-[#E8F5EC] text-brand-green">Batch {batch.id}</Badge>
            <span className="text-xs text-muted-foreground">{batch.time}</span>
            <Badge variant="ok">{batch.status}</Badge>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            Batch Total <span className="text-[#24190f]">{batch.total}</span>
          </span>
        </div>
        <div className="space-y-3">
          {batch.items.map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-brand-orange">{item.qty}x</span>
              <span className="font-medium">{item.name}</span>
              {item.tag ? (
                <span className="rounded bg-brand-orange/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-brand-orange">
                  {item.tag}
                </span>
              ) : null}
              <span className="ml-auto font-semibold">{item.price}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BillDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { restaurantId } = useOwnerAuth();

  const billId  = searchParams.get("billId");
  const orderId = searchParams.get("orderId");

  const { data, isLoading, isError } = useBill(restaurantId, billId ?? orderId);

  const [invoiceOpen, setInvoiceOpen] = useState(true);
  const paid = data?.paymentStatus === "paid";

  // Payment via waiter API — owner view is read-only
  function handleMarkPaid() {}

  if (isError) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load bill.</p>
      </DashboardLayout>
    );
  }
  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading bill…</p>
      </DashboardLayout>
    );
  }

  const summary = data.summary ?? data;
  const invoice = data.invoice ?? {};

  return (
    <DashboardLayout>
      {/* Back + Page header + actions */}
      <button
        type="button"
        onClick={() => navigate("/orders")}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[#24190f]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Orders
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bill Details</h1>
          <p className="text-sm text-muted-foreground">
            Review table orders and complete payment processing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print Bill
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button
            onClick={handleMarkPaid}
            disabled={paid || marking}
            className="gap-2 bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-70"
          >
            <Check className="h-4 w-4" />
            {paid ? "Paid ✓" : marking ? "Processing…" : "Mark As Paid"}
          </Button>
        </div>
      </div>

      {/* Table details */}
      <Card className="overflow-hidden border-l-4 border-l-brand-orange">
        <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Table Details
            </p>
            <p className="mt-1 text-2xl font-bold">Table {data.table}</p>
            <Badge className="mt-2 bg-[#E8F5EC] text-brand-green">{data.status}</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Timeline
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Started: {data.startedAt}
            </p>
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Waiter: {data.waiter}
            </p>
          </div>
          <div className="space-y-2 text-sm md:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Order Stats
            </p>
            <p>Total Items: {data.totalItems}</p>
            <p>Total Batches: {data.totalBatches}</p>
            <div className="pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Total Payable
              </p>
              <p className="text-2xl font-bold text-brand-red">{data.totalPayable}</p>
              <p className="text-[11px] text-muted-foreground">Incl. Taxes &amp; Charges</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order batches */}
      {data.batches.map((batch) => (
        <BatchCard key={batch.id} batch={batch} />
      ))}

      {/* Payment summary */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-base font-bold">Payment Summary</h2>
          <div className="space-y-3 text-sm">
            {summary.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-brand-green">
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                {summary.offer.label}
              </span>
              <span className="font-semibold">{summary.offer.value}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-brand-cream/60 pt-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Grand Total
              </p>
              <p className="text-2xl font-bold text-brand-red">{summary.grandTotal}</p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="grid h-7 w-10 place-items-center rounded border border-brand-cream/70">
                <CreditCard className="h-4 w-4" />
              </span>
              <span className="grid h-7 w-10 place-items-center rounded border border-brand-cream/70 text-[10px] font-bold">
                UPI
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GST invoice preview */}
      <Card>
        <CardContent className="p-6">
          <button
            type="button"
            onClick={() => setInvoiceOpen((v) => !v)}
            className="flex w-full items-center gap-2"
          >
            <ReceiptIcon />
            <span className="text-base font-bold">GST Invoice Preview</span>
            <span className="rounded bg-brand-red/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-brand-red">
              INCL GST
            </span>
            <ChevronUp
              className={cn(
                "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                !invoiceOpen && "rotate-180",
              )}
            />
          </button>

          {invoiceOpen ? (
            <div className="mt-5">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Restaurant Details
                  </p>
                  <p className="font-semibold">{invoice.restaurant.name}</p>
                  <p className="text-muted-foreground">GSTIN: {invoice.restaurant.gstin}</p>
                  <p className="text-muted-foreground">{invoice.restaurant.address}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Invoice Meta
                  </p>
                  <p className="text-muted-foreground">Date: {invoice.meta.date}</p>
                  <p className="text-muted-foreground">Time: {invoice.meta.time}</p>
                  <p className="text-muted-foreground">POS Terminal: {invoice.meta.posTerminal}</p>
                </div>
                <img
                  src={invoice.image}
                  alt="Dish"
                  className="h-24 w-32 rounded-lg object-cover"
                />
              </div>
              <p className="mt-5 text-[11px] text-muted-foreground">{invoice.disclaimer}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

function ReceiptIcon() {
  return (
    <span className="grid h-6 w-6 place-items-center rounded bg-brand-orange/10 text-brand-orange">
      <Printer className="h-3.5 w-3.5" />
    </span>
  );
}
