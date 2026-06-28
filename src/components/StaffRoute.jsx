import { Navigate, useLocation } from "react-router-dom";
import { useStaffAuth } from "@/context/StaffAuthContext";

// role: "waiter" | "chef" | undefined (any staff)
export default function StaffRoute({ children, role }) {
  const { isAuthenticated, staff } = useStaffAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;
  }

  if (role && staff?.role !== role) {
    // Authenticated but wrong role — redirect to the correct portal.
    const target = staff?.role === "waiter" ? "/waiter" : "/chef";
    return <Navigate to={target} replace />;
  }

  return children;
}
