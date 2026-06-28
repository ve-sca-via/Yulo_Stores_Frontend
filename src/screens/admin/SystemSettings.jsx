// System Settings (/admin/settings) — PRD §14.2 ADM-08. Platform OTP policy and
// notification configuration, persisted via the admin settings endpoint.

import { useEffect, useState } from "react";

import { requestJson } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "./AdminLayout";

const OTP_FIELDS = [
  { key: "length", label: "OTP Length", min: 4, max: 8 },
  { key: "expiryMinutes", label: "Expiry (minutes)", min: 1, max: 30 },
  { key: "resendCooldown", label: "Resend Cooldown (seconds)", min: 10, max: 120 },
  { key: "maxAttempts", label: "Max Failed Attempts", min: 3, max: 10 },
];

const NOTIF_FIELDS = [
  { key: "newRestaurant", label: "New restaurant onboarded", note: "Alert admins when a restaurant is added." },
  { key: "orderSpikes", label: "Order spikes", note: "Notify on unusual order volume." },
  { key: "offerExpiry", label: "Offer expiry", note: "Warn before platform offers expire." },
  { key: "systemHealth", label: "System health alerts", note: "Notify on degraded services." },
];

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    requestJson("/admin/settings")
      .then((payload) => setSettings(payload.data))
      .catch((err) => setError(err.message));
  }, []);

  const setOtp = (key, value) =>
    setSettings((s) => ({ ...s, otp: { ...s.otp, [key]: value } }));
  const setNotif = (key, value) =>
    setSettings((s) => ({ ...s, notifications: { ...s.notifications, [key]: value } }));

  async function save() {
    setSaving(true);
    setSavedNote("");
    try {
      await requestJson("/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSavedNote("Settings saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !settings) {
    return (
      <AdminLayout title="System Settings">
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </AdminLayout>
    );
  }
  if (!settings) {
    return (
      <AdminLayout title="System Settings">
        <p className="text-muted-foreground">Loading settings…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="System Settings"
      subtitle="Configure platform-wide OTP policy and admin notifications."
      action={
        <div className="flex items-center gap-3">
          {savedNote ? <span className="text-sm text-brand-green">{savedNote}</span> : null}
          <Button onClick={save} disabled={saving} className="bg-brand-gradient text-white hover:brightness-105">
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">OTP Authentication</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OTP_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <Input
                type="number"
                min={f.min}
                max={f.max}
                value={settings.otp[f.key]}
                onChange={(e) => setOtp(f.key, Number(e.target.value))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">Admin Notifications</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {NOTIF_FIELDS.map((f) => (
            <label
              key={f.key}
              className="flex items-center justify-between rounded-xl border border-brand-cream/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.note}</p>
              </div>
              <Switch checked={settings.notifications[f.key]} onCheckedChange={(v) => setNotif(f.key, v)} />
            </label>
          ))}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
