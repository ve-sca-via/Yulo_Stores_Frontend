import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, CheckCircle2, QrCode, UtensilsCrossed, X, XCircle } from "lucide-react";
import jsQR from "jsqr";

import { useStaffAuth } from "@/context/StaffAuthContext";
import { useWaiterSessions, useMarkPaid, useScanTable } from "@/hooks/staff/useWaiter";
import { staffApi } from "@/api/staff.api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import WaiterLayout from "./WaiterLayout";
import { useWaiter } from "./WaiterApp";

function QRScannerModal({ onClose, onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [status, setStatus] = useState("starting"); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState("");
  const [detected, setDetected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStatus("scanning");
          scan();
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access and try again."
            : "Could not access camera: " + err.message);
        }
      }
    }

    function scan() {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setDetected(code.data);
        setTimeout(() => {
          onScan(code.data);
          onClose();
        }, 800);
      } else {
        rafRef.current = requestAnimationFrame(scan);
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <QrCode className="h-4 w-4 text-brand-orange" /> Scan Table QR
          </span>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-square w-full bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay corners */}
          {status === "scanning" && !detected && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-56 w-56">
                <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-brand-orange" />
                <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-brand-orange" />
                <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-brand-orange" />
                <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-brand-orange" />
                <div className="absolute inset-0 overflow-hidden">
                  <div className="animate-scan-line absolute left-0 right-0 h-0.5 bg-brand-orange/70 shadow-[0_0_8px_2px_rgba(234,88,12,0.5)]" />
                </div>
              </div>
            </div>
          )}

          {/* Detected flash */}
          {detected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green">
                <CheckCheck className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm font-semibold text-white">QR Detected!</p>
              <p className="text-xs text-white/70">{detected}</p>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
              <XCircle className="h-10 w-10 text-brand-red" />
              <p className="text-sm text-white/80">{errorMsg}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-1 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
          )}

          {/* Starting spinner */}
          {status === "starting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          )}
        </div>

        <p className="px-4 py-3 text-center text-xs text-white/50">
          Point your camera at the table QR code
        </p>
      </div>
    </div>
  );
}

const FILTERS = ["All Orders", "Preparing", "Ready To Serve", "Served", "Bill Requested", "Completed"];

/* ── Derive batches from flat items array ── */
function toBatches(items, size = 3) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function batchStatus(batchIndex, batchCount, orderStatus) {
  const s = (orderStatus ?? "").toLowerCase();
  if (s === "cancelled") return "CANCELLED";
  if (s === "ready" || s === "served" || s === "completed") return "PREPARED";
  if (s === "preparing") return batchIndex < batchCount - 1 ? "PREPARED" : "PREPARING";
  return "PREPARING";
}

function BatchIcon({ status }) {
  if (status === "PREPARED")
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "CANCELLED")
    return <XCircle className="h-4 w-4 text-brand-maroon" />;
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand-orange bg-white">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
    </span>
  );
}

function BatchStatusBadge({ status }) {
  if (status === "PREPARED")
    return <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">PREPARED</span>;
  if (status === "CANCELLED")
    return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-maroon">CANCELLED</span>;
  return <span className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-orange">PREPARING</span>;
}

function orderStatusLabel(orderStatus, paymentStatus) {
  if (paymentStatus === "paid") return { label: "Completed", color: "text-muted-foreground" };
  const s = (orderStatus ?? "").toLowerCase();
  if (s === "ready") return { label: "Ready To Serve", color: "text-emerald-600" };
  if (s === "served") return { label: "Served", color: "text-emerald-600" };
  if (s === "cancelled") return { label: "Cancelled", color: "text-brand-maroon" };
  return { label: "Preparing", color: "text-brand-orange" };
}

function statusDot(color) {
  const map = {
    "text-emerald-600": "bg-emerald-500",
    "text-brand-orange": "bg-brand-orange",
    "text-brand-maroon": "bg-brand-maroon",
    "text-muted-foreground": "bg-gray-400",
  };
  return map[color] ?? "bg-gray-400";
}

function matchesFilter(order, filter) {
  if (filter === "All Orders") return true;
  const s = (order.orderStatus ?? "").toLowerCase();
  const p = (order.paymentStatus ?? "").toLowerCase();
  if (filter === "Preparing") return s === "new" || s === "preparing";
  if (filter === "Ready To Serve") return s === "ready";
  if (filter === "Served") return s === "served";
  if (filter === "Bill Requested") return p === "requested";
  if (filter === "Completed") return p === "paid" || s === "completed";
  return true;
}

/* ── Single order card ── */
function OrderCard({ order, onAction }) {
  const navigate = useNavigate();
  const { setActiveTable, clearCart, addToCart, setQuantity } = useWaiter();
  const batches = toBatches(order.items);

  function handleModify() {
    clearCart();
    setActiveTable(`T-${order.tableNumber}`);
    for (const item of order.items) {
      addToCart({ id: item.id, name: item.title, price: item.price ?? 0, foodType: "veg" });
      if (item.quantity > 1) setQuantity(item.id, item.quantity);
    }
    navigate("/waiter/menu");
  }

  function handleAddItems() {
    setActiveTable(`T-${order.tableNumber}`);
    navigate("/waiter/menu");
  }
  const { label, color } = orderStatusLabel(order.orderStatus, order.paymentStatus);
  const total = order.items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const billRequested = (order.paymentStatus ?? "") === "requested";
  const paid = (order.paymentStatus ?? "") === "paid";

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-cream/60 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-brand-cream/40 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-[#FFF0E6] px-3 py-1.5 text-sm font-bold text-brand-orange">
            T-{order.tableNumber}
          </span>
          <span className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-brand-orange">
            Dine-In
          </span>
          <span className={cn("flex items-center gap-1.5 text-sm font-semibold", color)}>
            <span className={cn("h-2 w-2 rounded-full", statusDot(color))} />
            {label}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {batches.length} Batches Total
          </p>
          <p className="text-base font-bold text-[#24190f]">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Batches */}
      <div className="divide-y divide-brand-cream/40 px-5">
        {batches.map((batch, bIdx) => {
          const bStatus = batchStatus(bIdx, batches.length, order.orderStatus);
          const cancelled = bStatus === "CANCELLED";
          return (
            <div key={bIdx} className="py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BatchIcon status={bStatus} />
                  <span className={cn("text-sm font-bold uppercase tracking-wide", cancelled ? "text-muted-foreground" : "")}>
                    Batch {String(bIdx + 1).padStart(2, "0")}
                  </span>
                </div>
                <BatchStatusBadge status={bStatus} />
              </div>
              <div className="space-y-2">
                {batch.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className={cn(
                      "flex items-center justify-between text-sm",
                      cancelled && "opacity-50",
                    )}
                  >
                    <span className="text-[#24190f]">
                      {item.quantity}x {item.title}
                    </span>
                    {item.price != null && (
                      <span className="font-medium text-[#24190f]">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions — 2 cols on xs, 4 cols on sm+ */}
      <div className="grid grid-cols-2 gap-px border-t border-brand-cream/50 bg-brand-cream/30 sm:grid-cols-4">
        <button
          type="button"
          onClick={handleAddItems}
          className="bg-white px-3 py-3.5 text-sm font-semibold text-[#24190f] transition hover:bg-brand-cream/20 first:rounded-bl-2xl sm:first:rounded-bl-2xl"
        >
          Add Items
        </button>
        <button
          type="button"
          onClick={handleModify}
          className="bg-white px-3 py-3.5 text-sm font-semibold text-[#24190f] transition hover:bg-brand-cream/20"
        >
          Modify Order
        </button>
        <button
          type="button"
          onClick={() => onAction(order.id, "served")}
          className="flex items-center justify-center gap-1.5 bg-white px-3 py-3.5 text-sm font-semibold text-[#24190f] transition hover:bg-brand-cream/20"
        >
          <CheckCheck className="h-4 w-4" /> Served
        </button>
        {paid ? (
          <button
            type="button"
            disabled
            className="rounded-br-2xl bg-white px-3 py-3.5 text-sm font-semibold text-muted-foreground sm:rounded-bl-none"
          >
            Paid
          </button>
        ) : billRequested ? (
          <button
            type="button"
            onClick={() => navigate("/waiter/orders")}
            className="rounded-br-2xl border border-brand-maroon bg-white px-3 py-3.5 text-sm font-bold text-brand-maroon transition hover:bg-brand-maroon/5 sm:rounded-bl-none"
          >
            View Bill
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction(order.id, "requested", true)}
            className="rounded-br-2xl bg-white px-3 py-3.5 text-sm font-semibold text-[#24190f] transition hover:bg-brand-cream/20 sm:rounded-bl-none"
          >
            Request Bill
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function WaiterDashboard() {
  const navigate = useNavigate();
  const { staff } = useStaffAuth();
  const restaurantId = staff?.restaurantId;

  const [activeTable, setActiveTable] = useState(null);
  const [filter, setFilter] = useState("All Orders");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  // TanStack Query — sessions auto-poll every 15s
  const { data: sessions = [], isLoading, error: sessionsErr } = useWaiterSessions(restaurantId);
  const { mutate: markPaid } = useMarkPaid(restaurantId);

  const error = actionError || sessionsErr?.message || "";

  // Flatten sessions to order-like objects the existing UI expects
  const orders = sessions.flatMap((session) =>
    (session.orders ?? [session]).map((o) => ({
      ...o,
      tableNumber: session.tableNumber ?? o.tableNumber,
      sessionId:   session._id ?? session.id,
    })),
  );

  function handleQRScan(value) {
    const match = String(value).match(/\d+/);
    if (match) setActiveTable(`T-${match[0]}`);
  }

  async function handleAction(orderId, status, isPayment = false) {
    setActionError("");
    try {
      if (isPayment) {
        // Find the session for this order to get sessionId
        const session = sessions.find(
          (s) => (s.orders ?? [s]).some((o) => (o._id ?? o.id) === orderId),
        );
        if (session) {
          markPaid({ sessionId: session._id ?? session.id, paymentMethod: "cash" });
        }
      } else {
        // Direct status update via staff.api (chef-side endpoint available to waiter view too)
        await staffApi.updateOrderStatus(restaurantId, orderId, status);
      }
    } catch (err) {
      setActionError(err.message);
    }
  }

  const filtered = orders.filter((o) => matchesFilter(o, filter));

  return (
    <WaiterLayout>
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-brand-cream/60 bg-[#FAFAF8] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-brand-red">Saffron Kitchen</p>
            <p className="text-xs text-muted-foreground">Waiter Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-brand-gradient text-xs font-bold text-white">
                {(staff?.name ?? "W").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold">{staff?.name ?? "Waiter"}</span>
              <span className="text-[10px] text-muted-foreground">Waiter</span>
            </div>
          </div>
        </div>
      </header>

      {/* Table context bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-cream/50 bg-[#FAFAF8] px-4 py-2.5 sm:px-6">
        <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <UtensilsCrossed className="h-4 w-4 shrink-0" />
          Table {activeTable}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3 py-2 text-sm font-bold text-white hover:brightness-105 sm:px-3.5"
          >
            <QrCode className="h-4 w-4" /> Scan QR
          </button>
          <button
            type="button"
            className="rounded-xl border border-brand-cream/80 bg-white px-3 py-2 text-sm font-semibold text-[#24190f] hover:bg-brand-cream/20 sm:px-3.5"
          >
            Select Table
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-4 py-5 sm:px-5">
        {/* Filter tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                filter === f
                  ? "border-brand-maroon bg-white text-brand-maroon"
                  : "border-brand-cream/70 bg-white text-[#5a403e] hover:border-brand-maroon/40 hover:text-brand-maroon",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-brand-maroon">{error}</p>
        )}

        {/* Order cards */}
        {isLoading ? (
          <div className="rounded-2xl border border-brand-cream/60 bg-white py-14 text-center text-sm text-muted-foreground animate-pulse">
            Loading orders…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-brand-cream/60 bg-white py-14 text-center text-sm text-muted-foreground">
            No orders for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard key={order._id ?? order.id} order={order} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
      {scannerOpen && (
        <QRScannerModal
          onClose={() => setScannerOpen(false)}
          onScan={handleQRScan}
        />
      )}
    </WaiterLayout>
  );
}
