// Order confirmation — shown immediately after placing an order (PRD §8.3 ORD-04).
// Displays the order ID, table/counter context, and links to live tracking.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import { requestJson } from "@/api";
import CustomerLayout, { formatPrice } from "./CustomerLayout";

function orderTotal(order) {
  return order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export default function Confirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson(`/customer/orders/${orderId}`)
      .then((payload) => setOrder(payload.data.order))
      .catch((err) => setError(err.message));
  }, [orderId]);

  return (
    <CustomerLayout>
      <div className="flex min-h-screen flex-col items-center px-5 py-12 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-[#E8F5EC] text-brand-green">
          <CheckCircle2 className="h-12 w-12" />
        </span>
        <h1 className="mt-6 text-2xl font-bold">Order placed!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your order has been sent to the kitchen.
        </p>

        {error ? <p className="mt-4 text-sm text-brand-maroon">{error}</p> : null}

        {order ? (
          <div className="mt-8 w-full rounded-2xl border border-brand-cream/70 bg-white p-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="font-bold">#{order.id.slice(-6)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {order.tableNumber ? "Table" : "Type"}
              </span>
              <span className="font-semibold capitalize">
                {order.tableNumber || order.orderType}
              </span>
            </div>
            <div className="my-4 border-t border-brand-cream/60" />
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.recipeId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}× {item.title}
                  </span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-brand-cream/60 pt-3 font-bold">
              <span>Total</span>
              <span className="text-brand-red">{formatPrice(orderTotal(order))}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-auto w-full space-y-3 pt-10">
          <button
            type="button"
            onClick={() => navigate(`/order/status/${orderId}`, { replace: true })}
            className="w-full rounded-xl bg-brand-gradient py-3.5 text-base font-bold text-white transition hover:brightness-105"
          >
            Track Order
          </button>
          <button
            type="button"
            onClick={() => navigate("/order/menu")}
            className="w-full rounded-xl border border-brand-cream py-3.5 text-base font-bold text-[#5a403e]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
}
