import { useMemo, useState } from "react";
import { Pencil, Plus, Search, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useMenuItems, useToggleMenuItem } from "@/hooks/owner/useMenuItems";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function MenuItems() {
  const { restaurantId } = useOwnerAuth();
  const navigate = useNavigate();

  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus]     = useState("all");

  const { data: items = [], isLoading, isError } = useMenuItems(restaurantId);
  const toggleMutation = useToggleMenuItem(restaurantId);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.categoryId?.name ?? ""));
    return ["all", ...set].filter(Boolean);
  }, [items]);

  const visible = useMemo(() =>
    items.filter((i) => {
      const name = i.name?.toLowerCase() ?? "";
      const cat  = i.categoryId?.name ?? "";
      const matchSearch   = name.includes(search.toLowerCase());
      const matchCategory = category === "all" || cat === category;
      const matchStatus   = status === "all"
        || (status === "available"   &&  i.isAvailable)
        || (status === "unavailable" && !i.isAvailable);
      return matchSearch && matchCategory && matchStatus;
    }),
  [items, search, category, status]);

  if (isError) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load menu items.</p>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Items</h1>
          <p className="text-sm text-muted-foreground">
            Browse the catalog and control item availability in real time.
          </p>
        </div>
        <Button
          onClick={() => navigate("/menu-management")}
          className="bg-brand-gradient text-white hover:brightness-105"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className="w-56 pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((mi) => (
          <Card key={mi._id} className="overflow-hidden">
            <div className="relative h-36">
              {mi.image ? (
                <img src={mi.image} alt={mi.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                  <UtensilsCrossed className="h-8 w-8" />
                </div>
              )}
              {mi.foodType && (
                <Badge
                  className={cn(
                    "absolute left-3 top-3",
                    mi.foodType === "veg"
                      ? "bg-[#E8F5EC] text-brand-green"
                      : "bg-[#FCE9E4] text-brand-maroon",
                  )}
                >
                  {mi.foodType.replace("_", " ").toUpperCase()}
                </Badge>
              )}
              {!mi.isAvailable && (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-maroon">
                    UNAVAILABLE
                  </span>
                </div>
              )}
            </div>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold leading-tight">{mi.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {mi.categoryId?.name ?? ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/menu-management", { state: { item: mi } })}
                  className="text-muted-foreground hover:text-brand-orange"
                  aria-label="Edit item"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-bold text-brand-red">
                    ₹{mi.discountedPrice ?? mi.sellingPrice}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {mi.prepTime ? `${mi.prepTime} min` : ""}
                  </span>
                </div>
                <label className="flex items-center gap-2 text-[11px] font-bold">
                  <span className={mi.isAvailable ? "text-brand-green" : "text-muted-foreground"}>
                    {mi.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                  </span>
                  <Switch
                    checked={!!mi.isAvailable}
                    disabled={toggleMutation.isPending}
                    onCheckedChange={() => toggleMutation.mutate(mi._id)}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}

        {visible.length === 0 && (
          <Card className="sm:col-span-2 xl:col-span-3">
            <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <UtensilsCrossed className="h-8 w-8" />
              No items match your filters.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
