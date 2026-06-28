// Shared staff view of customer assistance requests (PRD §11.5, §18 NOTIF-04).
// Used by the Waiter and Manager portals. Polls live, lets staff acknowledge and
// resolve, and separates open/active requests from resolved history.

import { useEffect, useMemo, useState } from "react";
import { Check, Eye } from "lucide-react";

import { requestJson } from "@/api";
import { cn } from "@/lib/utils";
import {
  REQUEST_TYPE_MAP,
  STATUS_TONE,
  requestLabel,
  timeAgo,
} from "./requestTypes";

export default function RequestsBoard() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");

  function load() {
    requestJson("/staff/requests")
      .then((payload) => setRequests(payload.data.requests))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 5000);
    return () => window.clearInterval(id);
  }, []);

  async function update(request, status) {
    setRequests((cur) => cur.map((r) => (r.id === request.id ? { ...r, status } : r)));
    try {
      await requestJson(`/staff/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const { active, resolved } = useMemo(() => {
    const all = requests ?? [];
    return {
      active: all.filter((r) => r.status !== "resolved"),
      resolved: all.filter((r) => r.status === "resolved"),
    };
  }, [requests]);

  if (error && !requests) {
    return <p className="text-sm text-brand-maroon">Failed to load: {error}</p>;
  }
  if (!requests) {
    return <p className="text-sm text-muted-foreground">Loading requests…</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-bold">Active Requests</h2>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              active.length ? "bg-[#FFF3E0] text-[#D9480F]" : "bg-[#F3F4F6] text-[#5F5F5F]",
            )}
          >
            {active.length}
          </span>
        </div>

        {active.length === 0 ? (
          <p className="rounded-2xl border border-brand-cream/70 bg-white p-6 text-center text-sm text-muted-foreground">
            No open requests. You&apos;re all caught up.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((r) => {
              const Icon = REQUEST_TYPE_MAP[r.type]?.icon;
              return (
                <article
                  key={r.id}
                  className={cn(
                    "rounded-2xl border bg-white p-4",
                    r.status === "open" ? "border-brand-orange/40" : "border-brand-cream/70",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange">
                        {Icon ? <Icon className="h-5 w-5" /> : null}
                      </span>
                      <div>
                        <p className="font-bold leading-tight">{requestLabel(r.type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.table ? `Table ${r.table} · ` : ""}{timeAgo(r.time)}
                        </p>
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", STATUS_TONE[r.status])}>
                      {r.status}
                    </span>
                  </div>

                  {r.note ? (
                    <p className="mt-3 rounded-lg bg-[#FCFAF7] px-3 py-2 text-sm text-muted-foreground">“{r.note}”</p>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    {r.status === "open" ? (
                      <button
                        type="button"
                        onClick={() => update(r, "acknowledged")}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand-cream bg-white py-2 text-xs font-bold text-[#5a403e] hover:bg-brand-cream/30"
                      >
                        <Eye className="h-3.5 w-3.5" /> Acknowledge
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => update(r, "resolved")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-gradient py-2 text-xs font-bold text-white hover:brightness-105"
                    >
                      <Check className="h-3.5 w-3.5" /> Resolve
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {resolved.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base font-bold">Resolved</h2>
          <div className="space-y-2">
            {resolved.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-brand-cream/60 bg-white px-4 py-2.5"
              >
                <span className="text-sm">
                  <span className="font-semibold">{requestLabel(r.type)}</span>
                  {r.table ? <span className="text-muted-foreground"> · Table {r.table}</span> : null}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{timeAgo(r.time)}</span>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", STATUS_TONE.resolved)}>
                    resolved
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
