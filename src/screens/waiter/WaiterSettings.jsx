import { useNavigate } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";

import { useStaffAuth } from "@/context/StaffAuthContext";
import WaiterLayout, { WaiterPageHeader } from "./WaiterLayout";

export default function WaiterSettings() {
  const navigate = useNavigate();
  const { staff, logout } = useStaffAuth();

  async function handleLogout() {
    await logout();
    navigate("/staff/login", { replace: true });
  }

  return (
    <WaiterLayout>
      <WaiterPageHeader title="Settings" subtitle="Manage your waiter session." />

      <div className="px-4 py-5 sm:px-5">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-brand-cream/60 bg-white p-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-gradient text-white">
              <UserRound className="h-7 w-7" />
            </span>
            <div>
              <p className="text-lg font-bold">{staff?.name ?? "Waiter"}</p>
              <p className="text-sm text-muted-foreground">
                Waiter · Code {staff?.staffCode ?? "—"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-cream bg-white py-3.5 text-sm font-bold text-brand-maroon hover:bg-brand-cream/20"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>
    </WaiterLayout>
  );
}
