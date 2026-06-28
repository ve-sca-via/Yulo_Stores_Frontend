// Item detail view — full description, rating, veg indicator, quantity selector
// and special instructions before adding to cart (PRD §8.1 MENU-01, §8.2 CART-04).

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, Star } from "lucide-react";

import { requestJson } from "@/api";
import CustomerLayout, { FoodThumb, VegDot, formatPrice } from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCustomer();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    requestJson("/customer/menu")
      .then((payload) => {
        const found = payload.data.items.find((i) => i.id === id);
        if (!found) setError("Item not found");
        else setItem(found);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <CustomerLayout title="Item" showBack>
        <p className="px-5 py-8 text-sm text-muted-foreground">{error}</p>
      </CustomerLayout>
    );
  }
  if (!item) {
    return (
      <CustomerLayout title="Item" showBack>
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
      </CustomerLayout>
    );
  }

  function handleAdd() {
    addToCart(item, quantity, instructions);
    navigate("/order/menu");
  }

  const footer = item.available ? (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-brand-cream/80 bg-white px-3 py-2.5">
        <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease">
          <Minus className="h-4 w-4 text-brand-orange" />
        </button>
        <span className="w-5 text-center font-bold">{quantity}</span>
        <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase">
          <Plus className="h-4 w-4 text-brand-orange" />
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="flex flex-1 items-center justify-between rounded-xl bg-brand-gradient px-4 py-3 text-white transition hover:brightness-105"
      >
        <span className="text-sm font-bold">Add to Cart</span>
        <span className="text-sm font-bold">{formatPrice(item.price * quantity)}</span>
      </button>
    </div>
  ) : (
    <div className="rounded-xl bg-[#F3F4F6] py-3 text-center text-sm font-semibold text-muted-foreground">
      Currently unavailable
    </div>
  );

  return (
    <CustomerLayout title="Item details" showBack footer={footer}>
      <FoodThumb src={item.image} alt={item.name} className="h-60 w-full" />

      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center gap-2">
          <VegDot type={item.foodType} />
          <span className="text-xs font-medium text-muted-foreground">
            {item.foodType === "veg" ? "Veg" : "Non-Veg"}
          </span>
          {item.popular ? (
            <span className="rounded bg-brand-saffron/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">
              POPULAR
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="text-xl font-bold">{item.name}</h2>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-brand-saffron text-brand-saffron" />
              {item.rating}
            </span>
            <span className="text-lg font-bold text-brand-red">{formatPrice(item.price)}</span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Special instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder="e.g. Less spicy, no onions"
            className="w-full resize-none rounded-xl border border-brand-cream/80 bg-white px-4 py-3 text-sm outline-none focus:border-brand-orange"
          />
        </div>
      </div>
    </CustomerLayout>
  );
}
