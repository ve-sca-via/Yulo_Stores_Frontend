// Users & Customers (/admin/users) — PRD §14.2 ADM-03. Search platform users and
// customers by name/contact, filter by role, and see restaurant mapping + status.

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { requestJson } from "@/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";
import AdminLayout from "./AdminLayout";

const ROLES = ["all", "owner", "manager", "chef", "waiter", "customer"];

const ROLE_VARIANT = {
  owner: "warn",
  manager: "info",
  chef: "muted",
  waiter: "muted",
  customer: "ok",
};

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  useEffect(() => {
    requestJson("/admin/users")
      .then((payload) => setUsers(payload.data.users))
      .catch((err) => setError(err.message));
  }, []);

  const visible = useMemo(
    () =>
      (users ?? []).filter((u) => {
        const matchesRole = role === "all" || u.role === role;
        const matchesSearch =
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.contact.toLowerCase().includes(search.toLowerCase());
        return matchesRole && matchesSearch;
      }),
    [users, search, role],
  );

  return (
    <AdminLayout title="Users & Customers" subtitle="Search platform users and customers across all restaurants.">
      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or contact…" className="w-64 pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition",
                role === r ? "bg-brand-gradient text-white" : "border border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">{visible.length} {visible.length === 1 ? "user" : "users"}</h2>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-brand-gradient text-[11px] font-semibold text-white">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.contact}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[u.role] ?? "muted"} className="capitalize">{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.restaurant}</TableCell>
                  <TableCell className="pr-6">
                    <Badge variant={u.status === "active" ? "ok" : "danger"} className="capitalize">{u.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {users ? "No users match your filters." : "Loading…"}
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
