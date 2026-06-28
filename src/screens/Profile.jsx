import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { ownerApi } from "@/api/owner.api";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const NOTIFICATION_OPTIONS = [
  { key: "newOrders",     label: "New orders",     note: "Alert me when a new order is placed." },
  { key: "cancellations", label: "Cancellations",  note: "Alert me on cancellation requests." },
  { key: "lowStock",      label: "Low stock",       note: "Alert me when inventory runs low." },
  { key: "dailyReport",   label: "Daily report",    note: "Email me a daily summary." },
];

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Profile() {
  const { user } = useOwnerAuth();

  const [form, setForm] = useState({
    name:          user?.name  ?? "",
    email:         user?.email ?? "",
    phone:         user?.phone ?? "",
    notifications: user?.notifications ?? {
      newOrders: true, cancellations: true, lowStock: false, dailyReport: true,
    },
  });
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [statusMsg, setStatusMsg] = useState("");

  const updateMutation = useMutation({
    mutationFn: (body) => ownerApi.updateProfile(body),
    onSuccess: () => {
      setStatusMsg("Profile saved");
      setPassword({ next: "", confirm: "" });
    },
    onError: (err) => setStatusMsg(err.response?.data?.message ?? "Save failed"),
  });

  function handleSave(e) {
    e.preventDefault();
    setStatusMsg("");
    if (password.next && password.next !== password.confirm) {
      setStatusMsg("Passwords do not match");
      return;
    }
    updateMutation.mutate({
      name:          form.name,
      email:         form.email,
      phone:         form.phone,
      notifications: form.notifications,
      ...(password.next ? { password: password.next } : {}),
    });
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account details and notification preferences.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statusMsg && (
              <span className={statusMsg.includes("not match") || statusMsg.includes("failed")
                ? "text-sm text-brand-maroon"
                : "text-sm text-brand-green"}
              >
                {statusMsg}
              </span>
            )}
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-brand-gradient text-white hover:brightness-105"
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Identity card */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-brand-gradient text-lg font-semibold text-white">
                {initials(form.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold">{form.name || "—"}</h2>
              <p className="text-sm text-muted-foreground">
                {user?.role ?? "owner"}
                {user?.createdAt
                  ? ` · joined ${new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
                  : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account details */}
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-base font-bold">Account Details</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={user?.role ?? "owner"} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-base font-bold">Change Password</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                value={password.next}
                onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Re-enter new password"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-base font-bold">Notification Preferences</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {NOTIFICATION_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="flex items-center justify-between rounded-xl border border-brand-cream/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.note}</p>
                </div>
                <Switch
                  checked={!!form.notifications[opt.key]}
                  onCheckedChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      notifications: { ...f.notifications, [opt.key]: v },
                    }))
                  }
                />
              </label>
            ))}
          </CardContent>
        </Card>
      </form>
    </DashboardLayout>
  );
}
