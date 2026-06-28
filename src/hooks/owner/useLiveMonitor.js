import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

export const liveMonitorKeys = {
  stats:    (rId) => ["live-monitor", rId, "stats"],
  visitors: (rId) => ["live-monitor", rId, "visitors"],
  repeat:   (rId) => ["live-monitor", rId, "repeat"],
};

export function useLiveStats(restaurantId) {
  return useQuery({
    queryKey: liveMonitorKeys.stats(restaurantId),
    queryFn: () => ownerApi.getLiveStats(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useLiveVisitors(restaurantId) {
  return useQuery({
    queryKey: liveMonitorKeys.visitors(restaurantId),
    queryFn: () => ownerApi.getLiveVisitors(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useLiveRepeat(restaurantId) {
  return useQuery({
    queryKey: liveMonitorKeys.repeat(restaurantId),
    queryFn: () => ownerApi.getLiveRepeat(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 60_000,
    staleTime: 0,
  });
}
