// Restaurant menu — category browsing, search, veg/non-veg + availability, and
// add-to-cart with quantity steppers (PRD §5, §8.1, §8.2). Sticky category bar
// and a cart bar that appears once items are added.

import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Search, Star } from "lucide-react";

import { useRestaurantMenu } from "@/hooks/customer/useMenu";
import { cn } from "@/lib/utils";
import CustomerLayout, { FoodThumb, VegDot, formatPrice } from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";

export default function Menu() {
  const navigate = useNavigate();
  const { session, cart, cartCount, cartTotal, addToCart, setQuantity } = useCustomer();

  // restaurantId comes from QR landing (stored in session) or defaults to a static value
  const restaurantId = session.restaurantId;
  const { data: menuData, isLoading, isError } = useRestaurantMenu(restaurantId);

  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("Recommended");
  const [foodFilter, setFoodFilter]         = useState("All");
  const sectionRefs = useRef({});

  const data = useMemo(() => {
    if (!menuData) return null;
    const items = menuData.items ?? menuData.menuItems ?? [];
    const categoryNames = [...new Set(items.map((i) => i.category?.name ?? i.category ?? ""))].filter(Boolean);
    return { items, categories: ["Recommended", ...categoryNames] };
  }, [menuData]);

  // Food-type chips: "All" plus whichever types the menu actually contains.
  const foodFilters = useMemo(() => {
    if (!data) return ["All"];
    const present = new Set(data.items.map((item) => item.foodType));
    return [
      "All",
      ...(present.has("veg") ? ["Veg"] : []),
      ...(present.has("non-veg") ? ["Non-Veg"] : []),
      ...(present.has("vegan") ? ["Vegan"] : []),
    ];
  }, [data]);

  const qtyFor = (id) => cart.find((line) => line.id === id || line.id === String(id))?.quantity ?? 0;

  const grouped = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.categories
      .map((category) => ({
        category,
        items: data.items.filter((item) => {
          const cat = item.category?.name ?? item.category ?? "";
          const inCategory = category === "Recommended" ? item.popular : cat === category;
          const matchesSearch = !term || item.name.toLowerCase().includes(term);
          const matchesFood   = foodFilter === "All" || item.foodType === foodFilter.toLowerCase();
          return inCategory && matchesSearch && matchesFood;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [data, search, foodFilter]);

  function scrollToCategory(category) {
    setActiveCategory(category);
    sectionRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (isError) {
    return (
      <CustomerLayout title="Menu" showNav activeNav="Menu">
        <p className="px-5 py-8 text-sm text-muted-foreground">Failed to load menu.</p>
      </CustomerLayout>
    );
  }
  if (isLoading || !data) {
    return (
      <CustomerLayout title="Menu" showNav activeNav="Menu">
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading menu…</p>
      </CustomerLayout>
    );
  }

  const cartBar =
    cartCount > 0 ? (
      <button
        type="button"
        onClick={() => navigate("/order/cart")}
        className="flex w-full items-center justify-between rounded-xl bg-brand-gradient px-4 py-3 text-white transition hover:brightness-105"
      >
        <span className="text-sm font-semibold">
          {cartCount} item{cartCount > 1 ? "s" : ""} · {formatPrice(cartTotal)}
        </span>
        <span className="text-sm font-bold">View Cart →</span>
      </button>
    ) : null;

  return (
    <CustomerLayout
      title={data.restaurant.name}
      showNav
      activeNav="Menu"
      footer={cartBar}
    >
      <div className="px-5 pt-3">
        <p className="text-sm text-muted-foreground">
          {session.tableNumber ? `Table ${session.tableNumber} · ` : ""}
          {session.orderType === "counter" ? "Counter" : session.orderType === "takeaway" ? "Takeaway" : "Dine-in"}
        </p>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="w-full rounded-xl border border-brand-cream/80 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-orange"
          />
        </div>

        {/* Food-type filter chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {foodFilters.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFoodFilter(type)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                foodFilter === type
                  ? "bg-brand-gradient text-white"
                  : "border border-brand-cream bg-white text-[#5a403e]",
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky category chips */}
      <div className="sticky top-[57px] z-10 mt-3 flex gap-2 overflow-x-auto border-b border-brand-cream/60 bg-brand-page/95 px-5 py-2.5 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {grouped.map((group) => (
          <button
            key={group.category}
            type="button"
            onClick={() => scrollToCategory(group.category)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              activeCategory === group.category
                ? "bg-brand-gradient text-white"
                : "border border-brand-cream bg-white text-[#5a403e]",
            )}
          >
            {group.category}
          </button>
        ))}
      </div>

      <div className="space-y-6 px-5 py-5">
        {grouped.map((group) => (
          <section
            key={group.category}
            ref={(el) => (sectionRefs.current[group.category] = el)}
          >
            <h2 className="mb-3 text-base font-bold">{group.category}</h2>
            <div className="space-y-3">
              {group.items.map((item) => {
                const qty = qtyFor(item.id);
                return (
                  <article
                    key={item.id}
                    className={cn(
                      "relative flex gap-3 rounded-2xl border border-brand-cream/70 bg-white p-3",
                      !item.available && "opacity-60",
                    )}
                  >
                    <FoodThumb
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-24 shrink-0 rounded-xl"
                    />

                    <button
                      type="button"
                      onClick={() => navigate(`/order/item/${item.id}`)}
                      className="min-w-0 flex-1 pb-8 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <VegDot type={item.foodType} />
                        {item.popular ? (
                          <span className="rounded bg-brand-saffron/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">
                            POPULAR
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-1 font-bold leading-tight">{item.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-brand-saffron text-brand-saffron" />
                        {item.rating}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-1.5 font-bold text-brand-red">{formatPrice(item.price)}</p>
                    </button>

                    {/* Add / quantity stepper anchored to the card's bottom-right. */}
                    <div className="absolute bottom-3 right-3">
                      {item.available ? (
                        qty > 0 ? (
                          <div className="flex items-center gap-3 rounded-lg border border-brand-orange bg-white px-2.5 py-1.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setQuantity(item.id, qty - 1)}
                              className="text-brand-orange"
                              aria-label="Decrease"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-4 text-center text-sm font-bold text-brand-orange">{qty}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(item.id, qty + 1)}
                              className="text-brand-orange"
                              aria-label="Increase"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(item, 1)}
                            className="rounded-lg bg-brand-red px-6 py-1.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
                          >
                            Add
                          </button>
                        )
                      ) : (
                        <span className="rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {grouped.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No dishes match “{search}”.
          </p>
        ) : null}
      </div>
    </CustomerLayout>
  );
}
