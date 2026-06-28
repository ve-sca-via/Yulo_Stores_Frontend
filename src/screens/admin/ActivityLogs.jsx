// Activity Logs (/admin/activity) — PRD §14.3, §19 (Activity Log entity). Audit
// trail of critical actions with user, role, entity, timestamp, and IP.

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { requestJson } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "./AdminLayout";

const ROLE_VARIANT = { admin: "danger", owner: "warn", manager: "info" };

function formatTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityLogs() {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    requestJson("/admin/activity")
      .then((payload) => setActivity(payload.data.activity))
      .catch((err) => setError(err.message));
  }, []);

  const visible = useMemo(
    () =>
      (activity ?? []).filter(
        (a) =>
          a.action.toLowerCase().includes(search.toLowerCase()) ||
          a.entity.toLowerCase().includes(search.toLowerCase()) ||
          a.user.toLowerCase().includes(search.toLowerCase()),
      ),
    [activity, search],
  );

  return (
    <AdminLayout title="Activity Logs" subtitle="Audit trail of critical platform and restaurant actions.">
      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search action, entity, user…" className="pl-9" />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">{visible.length} log entries</h2>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="pr-6">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="pl-6 font-medium">{a.action}</TableCell>
                  <TableCell className="text-muted-foreground">{a.entity}</TableCell>
                  <TableCell className="text-muted-foreground">{a.user}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[a.role] ?? "muted"} className="capitalize">{a.role}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.ip}</TableCell>
                  <TableCell className="pr-6 text-muted-foreground">{formatTime(a.time)}</TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {activity ? "No log entries match your search." : "Loading…"}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
