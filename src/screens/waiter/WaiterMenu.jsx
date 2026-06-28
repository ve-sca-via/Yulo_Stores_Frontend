import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, Star, UtensilsCrossed, UserRound } from "lucide-react";

import { useStaffAuth } from "@/context/StaffAuthContext";
import { useWaiterMenu } from "@/hooks/staff/useWaiter";
import client from "@/api/client";
import { cn } from "@/lib/utils";
import WaiterLayout, { formatPrice } from "./WaiterLayout";
import { useWaiter } from "./WaiterApp";

/* ── Normalize backend item → UI item ──────────────────────────────── */
function normalizeItem(raw, categoryName) {
  return {
    id:          raw._id?.toString() ?? raw.id,
    name:        raw.name,
    description: raw.description ?? "",
    image:       raw.image ?? null,
    // backend: "veg" | "non_veg" | "egg"  →  UI: "veg" | "non-veg" | "egg"
    foodType:    raw.foodType === "non_veg" ? "non-veg" : raw.foodType,
    price:       raw.discountedPrice ?? raw.sellingPrice ?? 0,
    available:   raw.isAvailable ?? true,
    category:    categoryName,
    popular:     false,
    rating:      0,
  };
}

function flattenMenu(categories = []) {
  const items = [];
  for (const cat of categories) {
    const catName = cat.name ?? "";
    for (const item of cat.items ?? []) items.push(normalizeItem(item, catName));
    for (const sub  of cat.subCategories ?? []) {
      for (const item of sub.items ?? []) items.push(normalizeItem(item, catName));
    }
  }
  return items;
}

/* ── food-type dot ── */
function FoodDot({ type }) {
  const t = (type ?? "").toLowerCase();
  if (t === "veg")
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-green-600">
        <span className="h-2 w-2 rounded-full bg-green-600" />
      </span>
    );
  if (t === "vegan")
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-green-500">
        <span className="h-2 w-2 rounded-full bg-green-500" />
      </span>
    );
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-brand-maroon">
      <span className="h-2 w-2 rounded-full bg-brand-maroon" />
    </span>
  );
}

/* ── Food type filter row ── */
const FOOD_FILTERS = [
  { key: "all",     label: "All",     icon: <span className="h-2 w-2 rounded-full bg-white" /> },
  { key: "veg",     label: "Veg",     icon: <span className="h-2 w-2 rounded-full bg-green-500" /> },
  { key: "non-veg", label: "Non Veg", icon: <span className="h-2 w-2 rounded-full bg-brand-maroon" /> },
  { key: "egg",     label: "Egg",     icon: <span className="h-2 w-2 rounded-full bg-yellow-400" /> },
];

function matchesFoodFilter(item, key) {
  if (key === "all") return true;
  return item.foodType === key;
}

function itemTags(item) {
  const tags = [];
  if (item.popular) tags.push("Popular");
  const t = (item.foodType ?? "").toLowerCase();
  if (t === "veg")     tags.push("Veg");
  if (t === "non-veg") tags.push("Non Veg");
  if (t === "egg")     tags.push("Egg");
  return tags.slice(0, 3);
}

/* ── Single item card ── */
function ItemCard({ item, inCart, onAdd, onRemove }) {
  const tags = itemTags(item);
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-white bg-white p-3.5 shadow-sm transition",
        !item.available && "opacity-60",
        item.available && "hover:shadow-md",
      )}
    >
      <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-xl bg-brand-cream/40">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🍽</div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="mb-0.5 flex items-center gap-1.5">
            <FoodDot type={item.foodType} />
            <p className="truncate text-sm font-bold text-[#24190f]">{item.name}</p>
          </div>
          <p className="mb-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
          {tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-brand-cream bg-brand-cream/30 px-2 py-0.5 text-[10px] font-medium text-[#5a403e]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-[#24190f]">{formatPrice(item.price)}</p>
          {item.available ? (
            inCart > 0 ? (
              <div className="flex items-center gap-0 overflow-hidden rounded-full bg-brand-gradient">
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="px-3 py-1.5 text-lg font-bold leading-none text-white transition hover:bg-white/10 active:scale-95"
                >
                  −
                </button>
                <span className="min-w-[20px] text-center text-sm font-bold text-white">
                  {inCart}
                </span>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="px-3 py-1.5 text-lg font-bold leading-none text-white transition hover:bg-white/10 active:scale-95"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm font-bold text-white transition hover:brightness-105 active:scale-95"
              >
                + Add
              </button>
            )
          ) : (
            <span className="rounded-full bg-[#F3F4F6] px-3 py-1.5 text-xs font-bold text-muted-foreground">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuSection({ title, items, cart, onAdd, onRemove }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="shrink-0 text-lg font-bold text-[#24190f]">{title}</h2>
        <div className="h-px flex-1 bg-brand-cream/60" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            inCart={cart.find((c) => c.id === item.id)?.quantity ?? 0}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function WaiterMenu() {
  const navigate = useNavigate();
  const { activeTable, cart, cartCount, subtotal, addToCart, setQuantity } = useWaiter();
  const { staff } = useStaffAuth();

  function removeOne(itemId) {
    const line = cart.find((c) => c.id === itemId);
    if (line) setQuantity(itemId, line.quantity - 1);
  }

  const { data: menuData, isLoading, isError } = useWaiterMenu(staff?.restaurantId);

  // Fetch restaurant name for the header
  const { data: restaurant } = useQuery({
    queryKey: ["restaurant-public", staff?.restaurantId],
    queryFn: () =>
      client
        .get(`/restaurants/${staff?.restaurantId}`)
        .then((r) => r.data.data.restaurant),
    enabled: !!staff?.restaurantId,
    staleTime: 30 * 60_000,
  });

  // Flatten categories → normalized items
  const rawCategories = menuData?.menu ?? [];
  const categoryNames = rawCategories.map((c) => c.name).filter(Boolean);
  const allItems = useMemo(() => flattenMenu(rawCategories), [menuData]);

  const [search, setSearch]                 = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [foodFilter, setFoodFilter]         = useState("all");
  const [showSearch, setShowSearch]         = useState(false);

  // Set first category once data loads
  useMemo(() => {
    if (!activeCategory && categoryNames.length > 0) setActiveCategory(categoryNames[0]);
  }, [categoryNames.length]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allItems.filter((item) => {
      const inCategory    = !activeCategory || item.category === activeCategory;
      const matchesType   = matchesFoodFilter(item, foodFilter);
      const matchesSearch = !term || item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
      return inCategory && matchesType && matchesSearch;
    });
  }, [allItems, activeCategory, foodFilter, search]);

  if (isError) {
    return (
      <WaiterLayout>
        <p className="px-5 py-5 text-sm text-muted-foreground">Failed to load menu.</p>
      </WaiterLayout>
    );
  }

  return (
    <WaiterLayout>
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-[#FAFAF8]">
        <div className="flex items-center justify-between border-b border-brand-cream/60 px-4 py-3 sm:px-5">
          <div>
            <p className="text-lg font-bold text-brand-red">
              {restaurant?.name ?? "Menu"}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <UtensilsCrossed className="h-3 w-3" /> Table {activeTable}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSearch((v) => !v)}
              className="rounded-full p-2 text-muted-foreground hover:bg-brand-cream/40 hover:text-[#24190f]"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full bg-brand-cream/50 text-muted-foreground hover:bg-brand-cream"
            >
              <UserRound className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search bar (toggle) */}
        {showSearch && (
          <div className="border-b border-brand-cream/60 px-4 py-2.5 sm:px-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes…"
                className="w-full rounded-full border border-brand-cream/80 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        )}

        {/* Food type filter */}
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FOOD_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFoodFilter(f.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                foodFilter === f.key
                  ? "border-brand-maroon bg-brand-maroon text-white"
                  : "border-brand-cream/70 bg-white text-[#5a403e] hover:border-brand-maroon/30",
              )}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        {categoryNames.length > 0 && (
          <div className="flex gap-5 overflow-x-auto border-b border-brand-cream/60 px-4 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryNames.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors",
                  activeCategory === cat
                    ? "border-brand-orange font-bold text-brand-orange"
                    : "border-transparent text-muted-foreground hover:text-[#24190f]",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <div className={cn("space-y-7 px-4 py-5 sm:px-5", cartCount > 0 && "pb-24")}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-brand-cream/60 bg-white py-14 text-center text-sm text-muted-foreground">
            {allItems.length === 0 ? "Menu abhi empty hai." : "No items match this filter."}
          </div>
        ) : (
          <MenuSection
            title={activeCategory || "Menu"}
            items={filtered}
            cart={cart}
            onAdd={addToCart}
            onRemove={removeOne}
          />
        )}
      </div>

      {/* ── Floating cart bar ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-[64px] left-0 right-0 z-40 px-4 pb-2">
          <div className="flex items-center justify-between rounded-2xl bg-brand-gradient px-5 py-3.5 shadow-lg">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                {cartCount} item{cartCount === 1 ? "" : "s"} added
              </p>
              <p className="text-lg font-bold text-white">{formatPrice(subtotal)}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/waiter")}
              className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/30"
            >
              View Cart <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </WaiterLayout>
  );
}
