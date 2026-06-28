// Cart — review items, adjust quantities, apply a coupon, see the bill summary,
// and place the order (PRD §8.2, §8.3). Submission is guarded against double
// taps (ORD-03) and maps the QR table/counter context onto the order.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";

import { usePlaceOrder } from "@/hooks/customer/useCustomerOrders";
import CustomerLayout, { FoodThumb, VegDot, formatPrice } from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";

// Demo coupons mirror the customer offers fixture.
const COUPONS = {
  WEEKEND20: { label: "20% off", apply: (subtotal) => Math.round(subtotal * 0.2) },
  LASSI15: { label: "₹15 off", apply: () => 15 },
};

export default function Cart() {
  const navigate = useNavigate();
  const { session, cart, cartTotal, setQuantity, removeFromCart, clearCart } = useCustomer();
  const placeOrderMutation = usePlaceOrder();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [error, setError] = useState("");
  const placing = placeOrderMutation.isPending;

  const discount = coupon ? COUPONS[coupon].apply(cartTotal) : 0;
  const taxes = Math.round((cartTotal - discount) * 0.05);
  const total = Math.max(0, cartTotal - discount) + taxes;

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!COUPONS[code]) {
      setCouponError("Invalid coupon code");
      setCoupon(null);
      return;
    }
    setCoupon(code);
    setCouponError("");
  }

  async function placeOrder() {
    if (placing || cart.length === 0) return;
    setError("");
    try {
      const { data } = await placeOrderMutation.mutateAsync({
        restaurantId: session.restaurantId,
        tableNumber: session.tableNumber,
        orderType: session.orderType ?? "dine-in",
        couponCode: coupon,
        items: cart.map((line) => ({
          menuItem: line.id,
          quantity: line.quantity,
          specialInstructions: line.instructions ?? "",
        })),
      });
      clearCart();
      const orderId = data.data?.order?._id ?? data.data?._id ?? data.data?.orderId;
      navigate(`/order/confirmation/${orderId}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    }
  }

  if (cart.length === 0) {
    return (
      <CustomerLayout title="Your cart" showNav activeNav="Cart">
        <div className="flex flex-col items-center gap-4 px-5 py-20 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-orange/10 text-brand-orange">
            <ShoppingBag className="h-9 w-9" />
          </span>
          <div>
            <h2 className="text-lg font-bold">Your cart is empty</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add dishes from the menu to get started.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/order/menu")}
            className="rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white"
          >
            Browse Menu
          </button>
        </div>
      </CustomerLayout>
    );
  }

  const footer = (
    <button
      type="button"
      onClick={placeOrder}
      disabled={placing}
      className="flex w-full items-center justify-between rounded-xl bg-brand-gradient px-4 py-3.5 text-white transition hover:brightness-105 disabled:opacity-60"
    >
      <span className="text-sm font-semibold">{formatPrice(total)}</span>
      <span className="text-sm font-bold">{placing ? "Placing order…" : "Place Order"}</span>
    </button>
  );

  return (
    <CustomerLayout title="Your cart" showBack footer={footer}>
      <div className="space-y-5 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          {session.tableNumber ? `Table ${session.tableNumber} · ` : ""}
          {session.orderType === "counter" ? "Counter" : session.orderType === "takeaway" ? "Takeaway" : "Dine-in"}
        </p>

        {/* Items */}
        <div className="space-y-3">
          {cart.map((line) => (
            <article key={line.id} className="flex gap-3 rounded-2xl border border-brand-cream/70 bg-white p-3">
              <FoodThumb src={line.image} alt={line.name} className="h-16 w-16 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <VegDot type={line.foodType} />
                  <h3 className="truncate font-semibold">{line.name}</h3>
                </div>
                {line.instructions ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">“{line.instructions}”</p>
                ) : null}
                <p className="mt-1 text-sm font-bold text-brand-red">{formatPrice(line.price)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  type="button"
                  onClick={() => removeFromCart(line.id)}
                  className="text-muted-foreground hover:text-brand-maroon"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 rounded-full border border-brand-orange bg-white px-2 py-1">
                  <button type="button" onClick={() => setQuantity(line.id, line.quantity - 1)} aria-label="Decrease">
                    <Minus className="h-3.5 w-3.5 text-brand-orange" />
                  </button>
                  <span className="w-4 text-center text-sm font-bold text-brand-orange">{line.quantity}</span>
                  <button type="button" onClick={() => setQuantity(line.id, line.quantity + 1)} aria-label="Increase">
                    <Plus className="h-3.5 w-3.5 text-brand-orange" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Coupon */}
        <div className="rounded-2xl border border-brand-cream/70 bg-white p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Tag className="h-4 w-4 text-brand-orange" /> Apply Coupon
          </p>
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="WEEKEND20"
              className="flex-1 rounded-xl border border-brand-cream/80 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="rounded-xl bg-brand-orange/10 px-4 text-sm font-bold text-brand-orange"
            >
              Apply
            </button>
          </div>
          {couponError ? <p className="mt-1.5 text-xs text-brand-maroon">{couponError}</p> : null}
          {coupon ? (
            <p className="mt-1.5 text-xs font-medium text-brand-green">
              {coupon} applied — {COUPONS[coupon].label}
            </p>
          ) : null}
        </div>

        {/* Bill summary */}
        <div className="rounded-2xl border border-brand-cream/70 bg-white p-4 text-sm">
          <p className="mb-3 font-semibold">Bill Summary</p>
          <div className="space-y-2 text-muted-foreground">
            <div className="flex justify-between">
              <span>Item total</span>
              <span className="text-foreground">{formatPrice(cartTotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-brand-green">
                <span>Coupon discount</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>Taxes &amp; charges (5%)</span>
              <span className="text-foreground">{formatPrice(taxes)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-brand-cream/60 pt-3 text-base font-bold">
            <span>To pay</span>
            <span className="text-brand-red">{formatPrice(total)}</span>
          </div>
        </div>

        {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}
      </div>
    </CustomerLayout>
  );
}
