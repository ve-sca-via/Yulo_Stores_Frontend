// Offers & Coupons (/offers) — Figma node 149:7. Create coupon/automatic offers
// with a full discount configuration, a live coupon preview, and a managed list
// of active/scheduled/expired offers (PRD §17).

import { useMemo, useState } from "react";
import { ArrowLeft, Copy, ImagePlus, Pencil, Trash2 } from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import {
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
  usePublishDiscount,
} from "@/hooks/owner/useDiscounts";
import { useMenuItems } from "@/hooks/owner/useMenuItems";
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

const DISCOUNT_TYPES = [
  { value: "percent", label: "Percentage" },
  { value: "flat", label: "Flat Amount" },
  { value: "free_item", label: "Free Item" },
  { value: "tableware", label: "Tablewise offer" },
];

const APPLICABLE = [
  { value: "dine-in", label: "Dine-in" },
  { value: "delivery", label: "Delivery" },
  { value: "both", label: "Both" },
];

const STATUS_VARIANT = { active: "ok", scheduled: "info", expired: "muted" };

const EMPTY = {
  name: "",
  type: "coupon",
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  discountName: "",
  item: "",
  minOrder: "",
  itemApplicability: "entire_menu",
  tableNumbers: "",
  applicableFor: "dine-in",
  validFrom: "",
  validTo: "",
};

function discountLabel(offer) {
  if (offer.discountType === "percent") return `${offer.discountValue}% Off`;
  if (offer.discountType === "flat") return `₹${offer.discountValue} Off`;
  if (offer.discountType === "free_item") return "Free Item";
  return "Tableware";
}

function validityLabel(offer) {
  if (!offer.validFrom && !offer.validTo) return "—";
  const fmt = (v) =>
    v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
  return `${fmt(offer.validFrom)} – ${fmt(offer.validTo)}`;
}

// Toggle chip used for offer type, discount type, and applicable-for.
function Pill({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-brand-gradient text-white"
          : "border border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
        className,
      )}
    >
      {children}
    </button>
  );
}

function RupeeInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>
      <Input value={value} onChange={onChange} placeholder={placeholder} className="pl-7" />
    </div>
  );
}

export default function Offers() {
  const { restaurantId } = useOwnerAuth();
  const { data: offers = [], isLoading } = useDiscounts(restaurantId);
  const { data: menuItems = [] }         = useMenuItems(restaurantId);
  const items = menuItems;

  const createMutation  = useCreateDiscount(restaurantId);
  const updateMutation  = useUpdateDiscount(restaurantId);
  const deleteMutation  = useDeleteDiscount(restaurantId);
  const publishMutation = usePublishDiscount(restaurantId);

  const [form, setForm]               = useState(EMPTY);
  const [drafts, setDrafts]           = useState([]);
  const [search, setSearch]           = useState("");
  const [error, setError]             = useState("");
  const [editingOffer, setEditingOffer] = useState(null);
  const [editForm, setEditForm]       = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Map frontend form shape → backend Zod schema shape
  function toPayload(f) {
    const typeMap = { percent: "percentage", flat: "flat_amount", free_item: "free_item", tableware: "tablewise" };
    const applicableMap = { "dine-in": "dine_in", delivery: "delivery", both: "both" };

    const payload = {
      offerName:          f.name,
      type:               typeMap[f.discountType] ?? "percentage",
      code:               f.code || undefined,
      applicableTo:       applicableMap[f.applicableFor] ?? "both",
      minimumOrderValue:  f.minOrder ? Number(f.minOrder) : 0,
      startDate:          f.validFrom,
      endDate:            f.validTo,
    };

    if (payload.type === "percentage")  payload.percentage  = Number(f.discountValue);
    if (payload.type === "flat_amount") payload.flatAmount  = Number(f.discountValue);
    if (payload.type === "free_item")   payload.freeItemId  = f.item;
    if (payload.type === "tablewise") {
      payload.flatAmount = Number(f.discountValue);
      payload.applicableTableNumbers = f.tableNumbers
        ? f.tableNumbers.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }
    return payload;
  }

  function saveDraft() {
    if (!form.name.trim()) { setError("Add an offer name before saving a draft"); return; }
    setError("");
    setDrafts((d) => [...d, { ...form, _draftId: Date.now() }]);
    setForm(EMPTY);
  }

  function loadDraft(draft) {
    setForm({ ...draft });
    setDrafts((d) => d.filter((x) => x._draftId !== draft._draftId));
  }

  function deleteDraft(draftId) {
    setDrafts((d) => d.filter((x) => x._draftId !== draftId));
  }

  async function publishDraft(draft) {
    if (!draft.validFrom || !draft.validTo) {
      setDrafts((d) => d.map((x) => x._draftId === draft._draftId ? { ...x, _error: "Add start/end dates before publishing" } : x));
      return;
    }
    try {
      await createMutation.mutateAsync(toPayload(draft));
      deleteDraft(draft._draftId);
    } catch (err) {
      setDrafts((d) => d.map((x) => x._draftId === draft._draftId ? { ...x, _error: err.response?.data?.message ?? err.message } : x));
    }
  }

  async function publish() {
    if (!form.name.trim()) { setError("Add an offer name before publishing"); return; }
    if (!form.validFrom || !form.validTo) { setError("Start date and end date are required"); return; }
    setError("");
    try {
      await createMutation.mutateAsync(toPayload(form));
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    }
  }

  function startEdit(offer) {
    setEditForm({ ...EMPTY, ...offer });
    setEditingOffer(offer);
  }

  function cancelEdit() {
    setEditingOffer(null);
    setEditForm(null);
  }

  async function saveEdit() {
    setError("");
    try {
      await updateMutation.mutateAsync({ dId: editingOffer._id, body: toPayload(editForm) });
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    }
  }

  async function deleteOffer(id) {
    await deleteMutation.mutateAsync(id);
    cancelEdit();
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  const visible = useMemo(
    () => offers.filter((o) => (o.offerName ?? "").toLowerCase().includes(search.toLowerCase())),
    [offers, search],
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading offers…</p>
      </DashboardLayout>
    );
  }

  /* ── Edit view ── */
  if (editingOffer && editForm) {
    const setEF = (patch) => setEditForm((f) => ({ ...f, ...patch }));
    return (
      <DashboardLayout>
        <button
          type="button"
          onClick={cancelEdit}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-orange hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Program Overview
        </button>

        <div>
          <h1 className="text-2xl font-bold">Edit coupons and offers</h1>
          <p className="text-sm text-muted-foreground">
            Configure rewards and visit requirements for this specific milestone.
          </p>
        </div>

        {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

        <Card>
          <CardContent className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
            {/* Offer Name — full width */}
            <div className="col-span-full space-y-1.5">
              <label className="text-sm font-medium text-[#24190f]">Offer Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEF({ name: e.target.value })}
                placeholder="Welcome Drink"
              />
            </div>

            {/* Reward Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#24190f]">Reward Type</label>
              <Select value={editForm.discountType} onValueChange={(v) => setEF({ discountType: v })}>
                <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Minimum Order Value */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#24190f]">Minimum Order Value</label>
              <RupeeInput
                value={editForm.minOrder}
                onChange={(e) => setEF({ minOrder: e.target.value })}
                placeholder="300"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#24190f]">Start Date</label>
              <Input
                type="date"
                value={editForm.validFrom}
                onChange={(e) => setEF({ validFrom: e.target.value })}
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#24190f]">End Date</label>
              <Input
                type="date"
                value={editForm.validTo}
                onChange={(e) => setEF({ validTo: e.target.value })}
              />
            </div>

            {/* Description — full width */}
            <div className="col-span-full space-y-1.5">
              <label className="text-sm font-medium text-[#24190f]">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEF({ description: e.target.value })}
                rows={4}
                placeholder="Describe the offer for your customers…"
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => deleteOffer(editingOffer._id ?? editingOffer.id)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-maroon"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={cancelEdit} className="focus-visible:ring-0">
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={saving}
              className="bg-brand-gradient px-6 text-white hover:brightness-105"
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Offers &amp; Coupons</h1>
        <p className="text-sm text-muted-foreground">
          Create promotions, reward loyal customers, and increase repeat purchases.
        </p>
      </div>

      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Builder */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-4">
              <h2 className="text-base font-bold">Create Offer / Coupon</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Offer Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "coupon", title: "Coupon", note: "Requires code at checkout" },
                    { value: "automatic", title: "Automatic", note: "Applies to all eligible orders" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set({ type: opt.value })}
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        form.type === opt.value
                          ? "border-brand-orange bg-brand-orange/5"
                          : "border-brand-cream bg-white hover:bg-brand-cream/20",
                      )}
                    >
                      <p className="text-sm font-bold">{opt.title}</p>
                      <p className="text-xs text-muted-foreground">{opt.note}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Offer Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="Summer Sundae Special"
                />
              </div>

              {form.type === "coupon" ? (
                <div className="space-y-1.5">
                  <Label>Coupon Code</Label>
                  <div className="relative">
                    <Input
                      value={form.code}
                      onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                      placeholder="ICECREAMFREE"
                      className="pr-10 font-mono tracking-wide"
                    />
                    <Copy className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>Offer Image</Label>
                <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#E2DFDE] bg-[#FCFAF7] text-center text-muted-foreground hover:border-brand-orange/50">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm">Click to upload or drag and drop</span>
                  <span className="text-xs">PNG, JPG up to 2MB</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Enjoy our signature gourmet sundae on the house with any ₹300 purchase."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <h2 className="text-base font-bold">Discount Configuration</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <div className="flex flex-wrap gap-2">
                  {DISCOUNT_TYPES.map((d) => (
                    <Pill key={d.value} active={form.discountType === d.value} onClick={() => set({ discountType: d.value })}>
                      {d.label}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Percentage */}
              {form.discountType === "percent" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Discount (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discountValue}
                      onChange={(e) => set({ discountValue: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Minimum Order Value</Label>
                    <RupeeInput
                      value={form.minOrder}
                      onChange={(e) => set({ minOrder: e.target.value })}
                      placeholder="300"
                    />
                  </div>
                </div>
              )}

              {/* Flat Amount */}
              {form.discountType === "flat" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Offer Name</Label>
                    <Input
                      value={form.discountName}
                      onChange={(e) => set({ discountName: e.target.value })}
                      placeholder="₹ 100 OFF Weekend Deal"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Discount amount</Label>
                    <RupeeInput
                      value={form.discountValue}
                      onChange={(e) => set({ discountValue: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="col-span-full space-y-1.5">
                    <Label>Item Applicability</Label>
                    <Select
                      value={form.itemApplicability}
                      onValueChange={(v) => set({ itemApplicability: v })}
                    >
                      <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select applicability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entire_menu">Entire Menu</SelectItem>
                        <SelectItem value="categories">Categories</SelectItem>
                        <SelectItem value="specific_items">Specific Items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Free Item */}
              {form.discountType === "free_item" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Select Item</Label>
                    <Input
                      value={form.item}
                      onChange={(e) => set({ item: e.target.value })}
                      placeholder="Gourmet Sundae"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Minimum Order Value</Label>
                    <RupeeInput
                      value={form.minOrder}
                      onChange={(e) => set({ minOrder: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>
              )}

              {/* Tablewise offer */}
              {form.discountType === "tableware" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Offer Name</Label>
                    <Input
                      value={form.discountName}
                      onChange={(e) => set({ discountName: e.target.value })}
                      placeholder="₹ 100 OFF Weekend Deal"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Discount amount</Label>
                    <RupeeInput
                      value={form.discountValue}
                      onChange={(e) => set({ discountValue: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="col-span-full space-y-1.5">
                    <Label>Table Number(s)</Label>
                    <Input
                      value={form.tableNumbers}
                      onChange={(e) => set({ tableNumbers: e.target.value })}
                      placeholder="EX: 4, 5, 6, 7"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Validity</Label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={form.validFrom}
                      onChange={(e) => set({ validFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <Input
                      type="date"
                      value={form.validTo}
                      onChange={(e) => set({ validTo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable For</Label>
                <div className="flex flex-wrap gap-2">
                  {APPLICABLE.map((a) => (
                    <Pill key={a.value} active={form.applicableFor === a.value} onClick={() => set({ applicableFor: a.value })}>
                      {a.label}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setForm(EMPTY)}
                  className="border-transparent bg-transparent text-[#5A403E] hover:bg-transparent hover:text-[#5A403E] focus-visible:ring-0"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  className="border-[#EFE7DD] bg-white text-[#24190F] hover:bg-white hover:text-[#24190F] focus-visible:ring-0"
                >
                  Save Draft
                </Button>
                <Button
                  onClick={publish}
                  disabled={saving}
                  className="bg-brand-gradient px-6 text-white hover:brightness-105"
                >
                  {saving ? "Publishing…" : "Publish Offer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div>
          <Card className="sticky top-6 overflow-hidden">
            <CardHeader className="pb-3">
              <h2 className="text-base font-bold">Live Preview</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Real-time form preview */}
              <div className="overflow-hidden rounded-2xl border border-dashed border-brand-orange/50">
                <div className="grid h-32 place-items-center bg-gradient-to-br from-brand-saffron to-brand-red text-white">
                  <ImagePlus className="h-7 w-7 opacity-80" />
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-lg font-extrabold uppercase text-brand-red">
                    {form.name || "Your offer title"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {form.description || "Offer description appears here for customers."}
                  </p>
                  <div className="flex items-center justify-between border-t border-dashed border-brand-cream pt-2.5">
                    <span className="font-mono text-sm font-bold tracking-wider text-brand-orange">
                      {form.type === "coupon" ? form.code || "CODE" : "AUTO-APPLIED"}
                    </span>
                    {form.minOrder ? (
                      <span className="text-xs text-muted-foreground">Min. order ₹{form.minOrder}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {discountLabel({ discountType: form.discountType, discountValue: form.discountValue || 0 })} ·{" "}
                {APPLICABLE.find((a) => a.value === form.applicableFor)?.label}
              </p>

              {/* Saved drafts */}
              {drafts.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-brand-cream/70" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Saved Drafts ({drafts.length})
                    </span>
                    <div className="h-px flex-1 bg-brand-cream/70" />
                  </div>
                  {drafts.map((draft) => (
                    <div
                      key={draft._draftId}
                      className="overflow-hidden rounded-xl border border-brand-cream bg-white"
                    >
                      <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#24190f]">{draft.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {discountLabel({ discountType: draft.discountType, discountValue: draft.discountValue || 0 })}
                            {draft.type === "coupon" && draft.code ? (
                              <span className="ml-2 font-mono font-semibold text-brand-orange">{draft.code}</span>
                            ) : null}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                          Draft
                        </span>
                      </div>
                      {draft._error ? (
                        <p className="px-3.5 pb-1 pt-1 text-xs text-red-500">{draft._error}</p>
                      ) : null}
                      <div className="mt-3 grid grid-cols-3 divide-x divide-brand-cream/60 border-t border-brand-cream/60">
                        <button
                          type="button"
                          onClick={() => loadDraft(draft)}
                          className="py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-brand-cream/20 hover:text-[#24190f]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => publishDraft(draft)}
                          disabled={saving}
                          className="py-2.5 text-xs font-medium text-brand-orange transition hover:bg-brand-orange/5 disabled:opacity-50"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDraft(draft._draftId)}
                          className="py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-red-50 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground/60">
                  Saved drafts will appear here
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active offers */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-base font-bold">Active Offers</h2>
            <p className="text-xs text-muted-foreground">Manage and track your ongoing restaurant promotions.</p>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search offers..."
            className="w-56"
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Offer Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((offer) => (
                <TableRow key={offer._id ?? offer.id}>
                  <TableCell className="pl-6">
                    <span className="font-semibold">{offer.offerName}</span>
                    {offer.code ? (
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{offer.code}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{offer.type}</TableCell>
                  <TableCell className="font-medium">{discountLabel(offer)}</TableCell>
                  <TableCell className="text-muted-foreground">{validityLabel(offer)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[offer.status] ?? "muted"} className="uppercase">
                      {offer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => startEdit(offer)} className="text-muted-foreground hover:text-brand-orange" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteOffer(offer._id ?? offer.id)}
                        className="text-muted-foreground hover:text-brand-maroon"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No offers found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
