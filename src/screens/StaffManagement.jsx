import { useState } from "react";
import { ChefHat, Trash2, UtensilsCrossed, UserPlus } from "lucide-react";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useStaff, useCreateStaff, useRemoveStaff, useUpdateStaff } from "@/hooks/owner/useStaff";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EMPTY_FORM = { name: "", role: "waiter", pin: "", email: "" };

function RoleBadge({ role }) {
  return (
    <Badge variant={role === "chef" ? "warn" : "info"}>
      {role === "chef" ? "Chef" : "Waiter"}
    </Badge>
  );
}

export default function StaffManagement() {
  const { restaurantId } = useOwnerAuth();

  const { data: staff = [], isLoading } = useStaff(restaurantId);
  const createMutation  = useCreateStaff(restaurantId);
  const removeMutation  = useRemoveStaff(restaurantId);
  const updateMutation  = useUpdateStaff(restaurantId);

  const [form, setForm]       = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [adding, setAdding]   = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");
    if (form.pin.length < 4) {
      setFormError("PIN kam se kam 4 digits ka hona chahiye");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name:  form.name,
        role:  form.role,
        pin:   form.pin,
        email: form.email || undefined,
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleToggleActive(member) {
    try {
      await updateMutation.mutateAsync({
        staffId:  member._id,
        isActive: !member.isActive,
      });
    } catch { /* silent */ }
  }

  async function handleRemove(staffId) {
    if (!window.confirm("Is staff member ko remove karna chahte ho?")) return;
    try {
      await removeMutation.mutateAsync(staffId);
    } catch { /* silent */ }
  }

  const chefs   = staff.filter((s) => s.role === "chef");
  const waiters = staff.filter((s) => s.role === "waiter");

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <p className="text-sm text-muted-foreground">
          Chef aur Waiter add karo. Login ke liye Restaurant ID + PIN chahiye.
        </p>
      </div>

      {/* Add Staff Form */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <UserPlus className="h-4 w-4" /> New Staff Member
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Naam *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ravi Kumar"
                required
                className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Role *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="waiter">Waiter</option>
                <option value="chef">Chef (Kitchen)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">PIN * (4–8 digits)</label>
              <input
                name="pin"
                value={form.pin}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    pin: e.target.value.replace(/\D/g, "").slice(0, 8),
                  }))
                }
                placeholder="1234"
                inputMode="numeric"
                required
                className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary tracking-widest"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email (optional)</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="staff@restaurant.com"
                className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            {formError && (
              <p className="col-span-full rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="col-span-full">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding…" : "Staff Add Karo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Staff Login Info */}
      <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm">
        <p className="font-semibold">Staff Login kaise kare?</p>
        <p className="mt-1 text-muted-foreground">
          URL: <span className="font-mono font-medium">/staff/login</span> &nbsp;→&nbsp;
          Restaurant ID: <span className="font-mono font-medium select-all">{restaurantId ?? "—"}</span> &nbsp;+&nbsp; uska PIN
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Chefs */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <ChefHat className="h-4 w-4" /> Chefs ({chefs.length})
            </h2>
            {chefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Koi chef nahi hai abhi.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {chefs.map((s) => (
                  <StaffCard
                    key={s._id}
                    member={s}
                    onToggle={handleToggleActive}
                    onRemove={handleRemove}
                    updatePending={updateMutation.isPending}
                    removePending={removeMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Waiters */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <UtensilsCrossed className="h-4 w-4" /> Waiters ({waiters.length})
            </h2>
            {waiters.length === 0 ? (
              <p className="text-sm text-muted-foreground">Koi waiter nahi hai abhi.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {waiters.map((s) => (
                  <StaffCard
                    key={s._id}
                    member={s}
                    onToggle={handleToggleActive}
                    onRemove={handleRemove}
                    updatePending={updateMutation.isPending}
                    removePending={removeMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function StaffCard({ member, onToggle, onRemove, updatePending, removePending }) {
  return (
    <div className="flex items-start justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{member.name}</p>
          {member.staffCode && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-bold">
              {member.staffCode}
            </span>
          )}
        </div>
        {member.email && (
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <RoleBadge role={member.role} />
          <Badge variant={member.isActive ? "ok" : "muted"}>
            {member.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 flex-col gap-2">
        <button
          onClick={() => onToggle(member)}
          disabled={updatePending}
          className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
        >
          {member.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => onRemove(member._id)}
          disabled={removePending}
          className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
