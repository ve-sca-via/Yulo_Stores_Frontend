// Staff & Roles (/admin/roles) — PRD §14.2 ADM-04, §15 RBAC. Shows the platform
// roles, their member counts, and the permission set each role grants.

import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";

import { requestJson } from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout, { formatNumber } from "./AdminLayout";

export default function StaffRoles() {
  const [roles, setRoles] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson("/admin/roles")
      .then((payload) => setRoles(payload.data.roles))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AdminLayout title="Staff & Roles" subtitle="Platform roles and the permissions each one grants.">
      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}
      {!roles ? (
        <p className="text-sm text-muted-foreground">Loading roles…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold">{role.name}</h3>
                      <p className="text-xs text-muted-foreground">{formatNumber(role.members)} members</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="space-y-1.5 border-t border-brand-cream/60 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Permissions</p>
                  {role.permissions.map((p) => (
                    <div key={p} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-brand-green" />
                      {p}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
