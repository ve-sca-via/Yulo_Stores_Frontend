import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

// Owner can only VIEW orders — status/payment mutations happen via staff endpoints
export const orderKeys = {
  all:  (rId)       => ["owner-orders", rId],
  list: (rId, p={}) => ["owner-orders", rId, "list", p],
  one:  (rId, id)   => ["owner-orders", rId, "order", id],
};

export function useOwnerOrders(restaurantId, params={}) {
  return useQuery({
    queryKey: orderKeys.list(restaurantId, params),
    queryFn: () => ownerApi.listOrders(restaurantId, params).then((r) => r.data.data.orders ?? []),
    enabled: !!restaurantId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useOwnerOrder(restaurantId, orderId) {
  return useQuery({
    queryKey: orderKeys.one(restaurantId, orderId),
    queryFn: () => ownerApi.getOrder(restaurantId, orderId).then((r) => r.data.data),
    enabled: !!restaurantId && !!orderId,
    staleTime: 15_000,
  });
}
