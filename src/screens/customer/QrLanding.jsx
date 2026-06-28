// QR landing screen — entry point after scanning a table/counter QR. Reads the
// restaurant + table/counter context from the URL, loads restaurant info, and
// routes the customer into login (if unverified) or the menu (PRD §5, §6).

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, MapPin, QrCode, Star, Utensils } from "lucide-react";

import { requestJson } from "@/api";
import CustomerLayout, { formatPrice } from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";

export default function QrLanding() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, setSession, cartTotal } = useCustomer();
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");

  const tableNumber = params.get("tableNumber") ?? "";
  const orderType = params.get("orderType") ?? (tableNumber ? "dine-in" : "counter");

  useEffect(() => {
    // Capture the QR context so it survives the OTP redirect.
    setSession((current) => ({ ...current, tableNumber, orderType }));
  }, [tableNumber, orderType, setSession]);

  useEffect(() => {
    requestJson("/customer/menu")
      .then((payload) => setRestaurant(payload.data.restaurant))
      .catch((err) => setError(err.message));
  }, []);

  function start() {
    navigate(session.verified ? "/order/menu" : "/order/login");
  }

  const closed = restaurant && restaurant.status !== "open";

  return (
    <CustomerLayout>
      <div className="flex min-h-screen flex-col">
        <div className="bg-brand-gradient px-5 pb-10 pt-8 text-white">
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <QrCode className="h-4 w-4" /> Scan successful
          </div>
          <h1 className="mt-3 text-2xl font-bold">Welcome to</h1>
          <p className="text-3xl font-extrabold">{restaurant?.name ?? "…"}</p>
          {restaurant?.tagline ? (
            <p className="mt-1 text-sm opacity-90">{restaurant.tagline}</p>
          ) : null}
        </div>

        <div className="-mt-6 flex-1 space-y-4 rounded-t-3xl bg-brand-page px-5 pt-6">
          {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

          <div className="rounded-2xl border border-brand-cream/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-bold text-brand-orange">
                <Utensils className="h-3.5 w-3.5" />
                {tableNumber ? `Table ${tableNumber}` : orderType === "counter" ? "Counter order" : "Takeaway"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  closed ? "bg-[#FCE9E4] text-brand-maroon" : "bg-[#E8F5EC] text-brand-green"
                }`}
              >
                {closed ? "Closed" : "Open now"}
              </span>
            </div>

            {restaurant ? (
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-brand-saffron text-brand-saffron" />
                  <span className="font-semibold text-foreground">{restaurant.rating}</span>
                  ({restaurant.reviews.toLocaleString("en-IN")} reviews)
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {restaurant.address}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {restaurant.timing}
                </p>
              </div>
            ) : null}
          </div>

          {closed ? (
            <p className="rounded-2xl bg-[#FCE9E4] p-4 text-center text-sm font-medium text-brand-maroon">
              This restaurant is currently closed. You can browse the menu but cannot place an order.
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 border-t border-brand-cream/60 bg-brand-page/95 px-5 py-4 backdrop-blur">
          <button
            type="button"
            onClick={start}
            className="w-full rounded-xl bg-brand-gradient py-3.5 text-base font-bold text-white transition hover:brightness-105"
          >
            {session.verified ? "Browse Menu" : "Start Ordering"}
          </button>
          {cartTotal > 0 ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              You have {formatPrice(cartTotal)} in your cart
            </p>
          ) : null}
        </div>
      </div>
    </CustomerLayout>
  );
}
