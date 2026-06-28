// Customer Assistance (/order/help) — raise a help request to restaurant staff
// and track its status (PRD §11.3, §18). Requests flow to the waiter/manager
// request boards and update live as staff acknowledge/resolve them.

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

import { requestJson } from "@/api";
import { cn } from "@/lib/utils";
import CustomerLayout from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";
import {
  REQUEST_TYPES,
  STATUS_TONE,
  requestLabel,
  timeAgo,
} from "@/screens/shared/requestTypes";

export default function CustomerHelp() {
  const { session } = useCustomer();
  const [type, setType] = useState("");
  const [note, setNote] = useState("");
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    requestJson(`/customer/requests?mobile=${encodeURIComponent(session.mobile)}`)
      .then((payload) => setRequests(payload.data.requests))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 5000);
    return () => window.clearInterval(id);
  }, [session.mobile]);

  async function send() {
    if (!type) {
      setError("Pick what you need first");
      return;
    }
    setSending(true);
    setError("");
    setStatus("");
    try {
      await requestJson("/customer/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: session.mobile,
          tableNumber: session.tableNumber,
          type,
          note,
        }),
      });
      setType("");
      setNote("");
      setStatus("Request sent — staff have been notified.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <CustomerLayout title="Assistance" showNav activeNav="Help">
      <div className="space-y-5 px-5 py-5">
        <p className="text-sm text-muted-foreground">
          {session.tableNumber ? `Table ${session.tableNumber} · ` : ""}Tap what you need and we&apos;ll alert the staff.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {REQUEST_TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition",
                  active
                    ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                    : "border-brand-cream/70 bg-white text-[#3f2d27] hover:bg-brand-cream/20",
                )}
              >
                <Icon className="h-6 w-6" />
                {t.label}
              </button>
            );
          })}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note (optional)"
          className="w-full resize-none rounded-xl border border-brand-cream/80 bg-white px-4 py-3 text-sm outline-none focus:border-brand-orange"
        />

        {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}
        {status ? <p className="text-sm text-brand-green">{status}</p> : null}

        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3.5 text-base font-bold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send Request"}
        </button>

        <div>
          <h2 className="mb-2 text-base font-bold">Your Requests</h2>
          {requests.length === 0 ? (
            <p className="rounded-2xl border border-brand-cream/70 bg-white p-6 text-center text-sm text-muted-foreground">
              No requests yet.
            </p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-2xl border border-brand-cream/70 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{requestLabel(r.type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.note ? `${r.note} · ` : ""}{timeAgo(r.time)}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", STATUS_TONE[r.status])}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
