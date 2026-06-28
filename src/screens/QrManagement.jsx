import { useState } from "react";
import { Download, Plus, Printer, QrCode, RotateCcw, Search } from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useTables, useCreateTable, useGenerateQR, useVoidQR } from "@/hooks/owner/useTables";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function downloadQr(code) {
  const filename = `qr-${code.label.replace(/\s+/g, "-").toLowerCase()}.png`;

  if (code.qrImageUrl.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = code.qrImageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  // Remote URL (Cloudinary etc.) — fetch as blob so browser saves instead of opening
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

function printQr(code) {
  const win = window.open("", "_blank", "width=480,height=560");
  if (!win) return;
  win.document.write(
    `<html><head><title>${code.label}</title><style>body{display:grid;place-items:center;height:100vh;margin:0;font-family:Inter,sans-serif;background:#FFF8F5}.card{text-align:center;padding:32px;border:1px solid #F5DFCE;border-radius:16px;background:#fff}img{display:block;margin:0 auto 16px}p{font-weight:700;font-size:18px;color:#23180E}</style></head><body>` +
    `<div class="card"><img src="${code.qrImageUrl}" width="240" height="240"/><p>${code.label}</p></div>` +
    `</body></html>`,
  );
  win.document.close();
  win.focus();
  win.print();
}

function QrCard({ code, onDownload, onPrint, onRegenerate }) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        {/* QR image area */}
        <div className="relative flex items-center justify-center bg-white p-6">
          {code.qrImageUrl ? (
            <img src={code.qrImageUrl} alt={code.label} className="h-28 w-28" />
          ) : (
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-cream text-muted-foreground">
              <QrCode className="h-8 w-8 opacity-30" />
            </div>
          )}
          {/* Status pill — top right */}
          <div className="absolute right-3 top-3">
            <Badge variant={code.active ? "ok" : "danger"} className="text-[10px] uppercase tracking-wider">
              {code.active ? "Active" : "Void"}
            </Badge>
          </div>
        </div>

        {/* Info row */}
        <div className="border-t border-brand-cream/60 px-4 py-3">
          <p className="text-sm font-bold text-[#24190f]">{code.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Generated {formatDate(code.generatedAt)}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 border-t border-brand-cream/60">
          <button
            type="button"
            onClick={onDownload}
            className="flex flex-col items-center gap-1 py-3 text-muted-foreground transition hover:bg-[#FFF8F5] hover:text-brand-orange"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Save</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="flex flex-col items-center gap-1 border-x border-brand-cream/60 py-3 text-muted-foreground transition hover:bg-[#FFF8F5] hover:text-brand-orange"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Print</span>
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="flex flex-col items-center gap-1 py-3 text-muted-foreground transition hover:bg-[#FFF8F5] hover:text-brand-orange"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Renew</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QrManagement() {
  const { restaurantId } = useOwnerAuth();
  const { data: tables = [], isLoading } = useTables(restaurantId);
  const createTable = useCreateTable(restaurantId);
  const generateQR  = useGenerateQR(restaurantId);
  const voidQR      = useVoidQR(restaurantId);

  const [tableNumber, setTableNumber] = useState("");
  const [search, setSearch]           = useState("");
  const [generated, setGenerated]     = useState(null);

  const codes = tables.map((t) => ({
    id:          t._id,
    label:       `Table ${t.identifier}`,
    qrImageUrl:  t.qrCode?.imageUrl ?? "",
    link:        t.qrCode?.url ?? "",
    active:      t.qrCode?.status === "active",
    generatedAt: t.qrCode?.generatedAt ?? t.updatedAt,
  }));

  const activeCodes = codes.filter((c) => c.active).length;

  async function generate(event) {
    event.preventDefault();
    if (!tableNumber.trim()) return;
    try {
      let table = tables.find((t) => String(t.identifier) === String(tableNumber.trim()));
      if (!table) {
        const res = await createTable.mutateAsync({ identifier: tableNumber.trim() });
        table = res.data?.data?.table;
      }
      if (!table?._id) return;

      const result = await generateQR.mutateAsync(table._id);
      const qr = result.data?.data?.qr;
      if (qr) {
        setGenerated({
          id:         table._id,
          label:      `Table ${table.identifier}`,
          qrImageUrl: qr.imageUrl,
          link:       qr.url,
        });
        setTableNumber("");
      }
    } catch {
      // error shown via generateQR.isError
    }
  }

  function regenerate(code) {
    generateQR.mutate(code.id);
  }

  const visible = codes.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">QR Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and manage ordering QR codes for each table.
          </p>
        </div>
        {/* Stats pills */}
        <div className="flex gap-3">
          <div className="rounded-xl border border-brand-cream/70 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-lg font-bold text-[#24190f]">{codes.length}</p>
            <p className="text-xs text-muted-foreground">Total Tables</p>
          </div>
          <div className="rounded-xl border border-brand-cream/70 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-lg font-bold text-brand-green">{activeCodes}</p>
            <p className="text-xs text-muted-foreground">Active QRs</p>
          </div>
        </div>
      </div>

      {generateQR.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Failed to generate QR code. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">

        {/* ── Left: Generate panel ── */}
        <div className="space-y-4 self-start">
          {/* Heading — same height as "All Tables" on the right */}
          <div className="flex h-9 items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
              <QrCode className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="text-base font-bold">Generate QR Code</h2>
          </div>

          <Card>
            <CardContent className="p-5">
              <form onSubmit={generate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Table Number / Identifier
                  </Label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 14"
                    className="text-center font-mono text-base tracking-widest"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={generateQR.isPending || !tableNumber.trim()}
                  className="w-full gap-2 bg-brand-gradient text-white hover:brightness-105 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {generateQR.isPending ? "Generating…" : "Generate QR Code"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Generated preview card */}
          {generated && (
            <Card className="overflow-hidden border-brand-green/30">
              <div className="border-b border-brand-cream/60 bg-[#E8F5EC] px-4 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-green">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  QR Generated — {generated.label}
                </p>
              </div>
              <CardContent className="p-5">
                <div className="flex justify-center rounded-xl border border-brand-cream/70 bg-white p-4">
                  <img src={generated.qrImageUrl} alt={generated.label} className="h-40 w-40" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadQr(generated)}>
                    <Download className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => printQr(generated)}>
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: QR grid ── */}
        <div className="min-w-0">
          {/* Grid header with search — h-9 matches left heading row */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex h-9 items-center text-base font-bold">
              All Tables
              {visible.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({visible.length})
                </span>
              )}
            </h2>
            <div className="relative w-full max-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tables…"
                className="rounded-full pl-8 text-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-52 animate-pulse rounded-xl bg-[#F5DFCE]/50" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-brand-cream/70 bg-white text-center">
              <QrCode className="mb-3 h-8 w-8 text-brand-cream" />
              <p className="text-sm font-semibold text-[#24190f]">
                {search ? "No tables match your search" : "No QR codes yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {search ? "Try a different table number" : "Generate your first QR code using the panel on the left"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((code) => (
                <QrCard
                  key={code.id}
                  code={code}
                  onDownload={() => downloadQr(code)}
                  onPrint={() => printQr(code)}
                  onRegenerate={() => regenerate(code)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
