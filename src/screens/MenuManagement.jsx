// Menu Management — Figma node 186:2680 (Main Content only; sidebar comes from
// the shared DashboardLayout). Built with shadcn form primitives + Tailwind.
// Data from the mock layer: GET /restaurant_owner/menu-management.

import { useState } from "react";
import {
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useMenuItems, useCategories, useCreateCategory, useCreateMenuItem, useUpdateMenuItem } from "@/hooks/owner/useMenuItems";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// A ₹-prefixed number input.
function RupeeInput({ value, defaultValue, onChange, className }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>
      <Input value={value} defaultValue={defaultValue} onChange={onChange} className={cn("pl-7", className)} />
    </div>
  );
}

// A selectable chip (category / sub-category).
function Chip({ label, active, dashed, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition",
        active && "bg-brand-gradient text-white",
        !active && !dashed && "border border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
        dashed && "border border-dashed border-[#D1D5DB] text-muted-foreground hover:bg-muted",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}

function VegDot({ type }) {
  const veg = type === "veg";
  return (
    <span
      className={cn(
        "grid h-4 w-4 place-items-center rounded-sm border",
        veg ? "border-brand-green" : "border-brand-maroon",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", veg ? "bg-brand-green" : "bg-brand-maroon")} />
    </span>
  );
}

const PREP_TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

// foodType display label → backend value
const FOOD_TYPE_OPTIONS = [
  { label: "VEG",     value: "veg" },
  { label: "NON-VEG", value: "non_veg" },
  { label: "EGG",     value: "egg" },
];

export default function MenuManagement() {
  const { restaurantId } = useOwnerAuth();

  const { data: currentItems = [], isLoading } = useMenuItems(restaurantId);
  const { data: categoryList = [] }            = useCategories(restaurantId);
  const createMutation         = useCreateMenuItem(restaurantId);
  const updateMutation         = useUpdateMenuItem(restaurantId);
  const createCategoryMutation = useCreateCategory(restaurantId);

  const [item, setItem] = useState({
    name: "", description: "", prepTime: 20,
    sellingPrice: "", categoryId: "", categoryName: "", foodType: "veg",
  });
  const [imageFile, setImageFile]       = useState(null);
  const [statusMsg, setStatusMsg]       = useState("");
  const [newCatName, setNewCatName]     = useState("");
  const [showNewCat, setShowNewCat]     = useState(false);

  const ingredients = [];
  const addons = [];

  async function handleSubmit() {
    setStatusMsg("");
    if (!item.name || !item.categoryId || !item.sellingPrice) {
      setStatusMsg("Name, category and price are required.");
      return;
    }
    const formData = new FormData();
    formData.append("name", item.name);
    formData.append("description", item.description ?? "");
    formData.append("sellingPrice", item.sellingPrice);
    formData.append("categoryId", item.categoryId);
    formData.append("foodType", item.foodType);
    formData.append("prepTime", item.prepTime);
    if (imageFile) formData.append("image", imageFile);
    try {
      if (item._id) await updateMutation.mutateAsync({ itemId: item._id, formData });
      else          await createMutation.mutateAsync(formData);
      setStatusMsg(item._id ? "Item updated!" : "Item created!");
      setItem({ name: "", description: "", prepTime: 20, sellingPrice: "", categoryId: "", categoryName: "", foodType: "veg" });
      setImageFile(null);
    } catch (err) {
      setStatusMsg(err.response?.data?.message ?? err.message);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading menu management…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="text-sm text-muted-foreground">
          Create, update and manage restaurant menu items.
        </p>
      </div>

      {/* Item Information */}
      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">Item Information</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E2DFDE] bg-[#FCFAF7] text-center transition hover:border-brand-orange/50">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#FFDAD6]/50 text-brand-orange">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-sm text-muted-foreground">
              Upload Food Photo or Drag &amp; Drop
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </label>

          <div className="space-y-1.5">
            <Label>Item Name</Label>
            <Input value={item.name} onChange={(e) => setItem((i) => ({ ...i, name: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <span className="text-xs text-muted-foreground">
                {(item.description ?? "").length}/{item.descriptionMax}
              </span>
            </div>
            <Textarea value={item.description} maxLength={item.descriptionMax} onChange={(e) => setItem((i) => ({ ...i, description: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Preparation Time</Label>
            <Select value={String(item.prepTime)} onValueChange={(v) => setItem((i) => ({ ...i, prepTime: Number(v) }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PREP_TIME_OPTIONS.map((o) => (
                  <SelectItem key={o} value={String(o)}>{o} min</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category & Pricing */}
      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">Category &amp; Pricing</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {categoryList.map((c) => (
                <Chip
                  key={c._id}
                  label={c.name}
                  active={c._id === item.categoryId}
                  onClick={() => setItem((i) => ({ ...i, categoryId: c._id, categoryName: c.name }))}
                />
              ))}
              <Chip label="+ Add Category" dashed icon={Plus} onClick={() => setShowNewCat((v) => !v)} />
            </div>
            {showNewCat && (
              <div className="flex gap-2">
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name"
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!newCatName.trim() || createCategoryMutation.isPending}
                  onClick={async () => {
                    const res = await createCategoryMutation.mutateAsync({ name: newCatName.trim() });
                    const cat = res.data?.data?.category;
                    if (cat) setItem((i) => ({ ...i, categoryId: cat._id, categoryName: cat.name }));
                    setNewCatName("");
                    setShowNewCat(false);
                  }}
                >
                  Save
                </Button>
              </div>
            )}
            {!item.categoryId && <p className="text-xs text-muted-foreground">Select or create a category</p>}
          </div>

          <div className="space-y-2">
            <Label>Food Type</Label>
            <div className="flex flex-wrap gap-2">
              {FOOD_TYPE_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setItem((i) => ({ ...i, foodType: value }))}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    value === item.foodType
                      ? "border-brand-green bg-[#E8F5EC] text-brand-green"
                      : "border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
                  )}
                >
                  <VegDot type={value} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Selling Price</Label>
              <RupeeInput value={item.sellingPrice} onChange={(e) => setItem((i) => ({ ...i, sellingPrice: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients & Food Cost */}
      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">Ingredients &amp; Food Cost</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead>Ingredient</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell className="font-medium">{ing.name}</TableCell>
                  <TableCell>{ing.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{ing.unit}</TableCell>
                  <TableCell className="font-semibold">₹{ing.cost}</TableCell>
                  <TableCell>
                    <button type="button" className="text-muted-foreground hover:text-brand-maroon">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="rounded-xl border border-brand-cream/70 bg-[#FCFAF7] p-4">
            <p className="text-sm font-semibold">Add New Ingredient</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Add a new raw material to calculate food cost
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Ingredient Name</Label>
                <Input placeholder="e.g. Basmati Rice" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input defaultValue="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unit</Label>
                <Select defaultValue="gm">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gm">gm</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cost</Label>
                <RupeeInput defaultValue="0" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-brand-orange text-white hover:bg-brand-orange/90">
                Add Ingredient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add-ons & Extras */}
      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">Add-ons &amp; Extras</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className="flex items-center gap-4 rounded-xl border border-brand-cream/70 px-4 py-3"
            >
              <Switch defaultChecked={addon.enabled} />
              <div>
                <p className="text-sm font-semibold">{addon.name}</p>
                <p className="text-xs text-muted-foreground">{addon.note}</p>
              </div>
              <span className="ml-auto text-sm font-semibold text-brand-green">
                +₹{addon.price}
              </span>
              <button type="button" className="text-muted-foreground hover:text-brand-orange">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" className="text-muted-foreground hover:text-brand-maroon">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="rounded-xl border border-brand-cream/70 bg-[#FCFAF7] p-4">
            <p className="text-sm font-semibold">Add New Add-on</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Create an optional item customers can add to their order
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input placeholder="Enter add-on name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Food Type</Label>
                    <Select defaultValue="Veg">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Veg">Veg</SelectItem>
                        <SelectItem value="Non-Veg">Non-Veg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantity</Label>
                    <Input defaultValue="1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Unit</Label>
                    <Select defaultValue="Piece">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Piece">Piece</SelectItem>
                        <SelectItem value="Serving">Serving</SelectItem>
                        <SelectItem value="Bowl">Bowl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pricing</Label>
                    <RupeeInput defaultValue="50" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex h-[104px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#E2DFDE] bg-white text-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Item Image</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 2MB</span>
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-brand-cream/70 bg-white p-3">
                  <span className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-brand-saffron to-brand-red" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">Item Name</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-brand-green">VEG</span> · 1 Serving
                    </p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-brand-red">₹50</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-brand-orange text-white hover:bg-brand-orange/90">
                Save Add-on
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3">
        {statusMsg && (
          <span className={`text-sm font-medium ${statusMsg.includes("!") ? "text-brand-green" : "text-red-500"}`}>
            {statusMsg}
          </span>
        )}
        <Button variant="outline" className="px-6" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
          Save Draft
        </Button>
        <Button className="bg-brand-gradient px-6 text-white hover:brightness-105" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
          {createMutation.isPending || updateMutation.isPending ? "Saving…" : "Publish Item"}
        </Button>
      </div>

      {/* Current Menu Items */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">Current Menu Items</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search dishes..." className="w-56 pl-9" />
          </div>
          <Select defaultValue="all-categories">
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              <SelectItem value="main">Main Course</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
              <SelectItem value="beverage">Beverage</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-status">
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {currentItems.map((mi) => (
          <Card key={mi._id} className="overflow-hidden">
            <div className="relative h-36">
              {mi.image ? (
                <img src={mi.image} alt={mi.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-xs">No image</div>
              )}
              {mi.foodType && (
                <Badge
                  className={cn(
                    "absolute left-3 top-3",
                    mi.foodType === "veg" ? "bg-[#E8F5EC] text-brand-green" : "bg-[#FCE9E4] text-brand-maroon",
                  )}
                >
                  {mi.foodType.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </div>
            <CardContent className="space-y-3 p-4">
              <div>
                <h3 className="font-bold leading-tight">{mi.name}</h3>
                <p className="text-xs text-muted-foreground">{mi.categoryId?.name ?? ""}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-bold text-brand-red">₹{mi.discountedPrice ?? mi.sellingPrice}</span>
                  <span className="text-xs text-muted-foreground">{mi.prepTime ? `${mi.prepTime} min` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-bold", mi.isAvailable ? "text-brand-green" : "text-muted-foreground")}>
                    {mi.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                  </span>
                  <Switch defaultChecked={mi.isAvailable} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
