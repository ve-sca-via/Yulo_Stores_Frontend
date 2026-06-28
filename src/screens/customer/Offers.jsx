// Customer offers — active restaurant promotions the customer can use at
// checkout (PRD §5.2 CUST-10, §17.1 OFF-07). Tapping copies the coupon code.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Tag } from "lucide-react";

import { requestJson } from "@/api";
import CustomerLayout from "./CustomerLayout";

export default function Offers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    requestJson("/customer/offers")
      .then((payload) => setOffers(payload.data.offers))
      .catch((err) => setError(err.message));
  }, []);

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <CustomerLayout title="Offers" showNav activeNav="Offers">
      <div className="space-y-4 px-5 py-5">
        {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}
        {!offers ? (
          <p className="text-sm text-muted-foreground">Loading offers…</p>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
            <Tag className="h-10 w-10" />
            No active offers right now.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="overflow-hidden rounded-2xl border border-brand-cream/70 bg-white"
            >
              <div className="flex items-start gap-3 bg-brand-orange/5 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
                  <Tag className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold leading-tight">{offer.title}</h3>
                    <span className="rounded bg-brand-saffron/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">
                      {offer.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyCode(offer.code)}
                className="flex w-full items-center justify-between border-t border-dashed border-brand-cream px-4 py-3"
              >
                <span className="font-mono text-sm font-bold tracking-wider text-brand-red">
                  {offer.code}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-orange">
                  <Copy className="h-3.5 w-3.5" />
                  {copied === offer.code ? "Copied!" : "Tap to copy"}
                </span>
              </button>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={() => navigate("/order/menu")}
          className="w-full rounded-xl bg-brand-gradient py-3.5 text-base font-bold text-white"
        >
          Order Now
        </button>
      </div>
    </CustomerLayout>
  );
}
