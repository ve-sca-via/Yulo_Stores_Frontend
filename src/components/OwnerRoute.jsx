import { Navigate, useLocation } from "react-router-dom";
import { useOwnerAuth } from "@/context/OwnerAuthContext";

// Shows a blank screen while the initial token refresh is in-flight,
// then redirects to login if no valid session exists.
export default function OwnerRoute({ children }) {
  const { isAuthenticated, loading } = useOwnerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/owner/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
