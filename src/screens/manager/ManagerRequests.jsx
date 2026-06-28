// Manager · Customer Requests (/manager/requests) — monitor and resolve guest
// assistance requests across the floor (PRD §12.3 alerts, §18 NOTIF-04).

import DashboardLayout from "@/components/DashboardLayout";
import RequestsBoard from "@/screens/shared/RequestsBoard";

const MANAGER_PROFILE = { restaurantName: "Saffron Kitchen", userName: "Alex Mercy", role: "Manager" };

export default function ManagerRequests() {
  return (
    <DashboardLayout profile={MANAGER_PROFILE}>
      <div>
        <h1 className="text-2xl font-bold">Customer Requests</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and resolve guest assistance requests across the restaurant.
        </p>
      </div>
      <RequestsBoard />
    </DashboardLayout>
  );
}
