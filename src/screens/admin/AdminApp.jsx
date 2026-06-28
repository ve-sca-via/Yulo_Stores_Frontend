// Platform Admin portal (/admin/*) — PRD §14. Nested routes under the shared
// AdminLayout shell.

import { Navigate, Route, Routes } from "react-router-dom";

import AdminDashboard from "./AdminDashboard";
import Restaurants from "./Restaurants";
import AdminUsers from "./AdminUsers";
import StaffRoles from "./StaffRoles";
import AdminQr from "./AdminQr";
import OrderMonitoring from "./OrderMonitoring";
import OfferMonitoring from "./OfferMonitoring";
import ActivityLogs from "./ActivityLogs";
import SystemSettings from "./SystemSettings";

export default function AdminApp() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="restaurants" element={<Restaurants />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="roles" element={<StaffRoles />} />
      <Route path="qr" element={<AdminQr />} />
      <Route path="orders" element={<OrderMonitoring />} />
      <Route path="offers" element={<OfferMonitoring />} />
      <Route path="activity" element={<ActivityLogs />} />
      <Route path="settings" element={<SystemSettings />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
