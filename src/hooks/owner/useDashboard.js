import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

// ── Query key factory ────────────────────────────────────────────────
// Centralised so invalidation targets are consistent across the app.
export const dashboardKeys = {
  all:          (rId) => ["dashboard", rId],
  kpis:         (rId) => ["dashboard", rId, "kpis"],
  sales:        (rId, period) => ["dashboard", rId, "sales", period],
  topItems:     (rId) => ["dashboard", rId, "top-items"],
  recentOrders: (rId) => ["dashboard", rId, "recent-orders"],
};

// ── Dashboard KPIs ───────────────────────────────────────────────────
// Returns: { totalOrders, revenue, liveMonitoring, averageRating }
export function useDashboardKPIs(restaurantId) {
  return useQuery({
    queryKey: dashboardKeys.kpis(restaurantId),
    queryFn: () => ownerApi.getDashboardKPIs(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    staleTime: 60_000,        // re-use cached value for 1 min
    refetchInterval: 120_000, // background poll every 2 min
  });
}

// ── Sales Chart ──────────────────────────────────────────────────────
// period: "today" | "week" | "month"
export function useSalesChart(restaurantId, period = "week") {
  return useQuery({
    queryKey: dashboardKeys.sales(restaurantId, period),
    queryFn: () => ownerApi.getSalesChart(restaurantId, period).then((r) => r.data.data.chart),
    enabled: !!restaurantId,
    staleTime: 60_000,
  });
}

// ── Top Items ────────────────────────────────────────────────────────
export function useTopItems(restaurantId, limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.topItems(restaurantId),
    queryFn: () => ownerApi.getTopItems(restaurantId, limit).then((r) => r.data.data.items),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000, // items don't change quickly
  });
}

// ── Recent Orders ────────────────────────────────────────────────────
export function useRecentOrders(restaurantId, limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.recentOrders(restaurantId),
    queryFn: () => ownerApi.getRecentOrders(restaurantId, limit).then((r) => r.data.data.orders),
    enabled: !!restaurantId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
