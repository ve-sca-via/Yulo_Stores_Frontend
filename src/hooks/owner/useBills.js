import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

export const billKeys = {
  list: (rId, p={}) => ["bills", rId, "list", p],
  one:  (rId, id)   => ["bills", rId, "bill", id],
};

export function useBills(restaurantId, params={}) {
  return useQuery({
    queryKey: billKeys.list(restaurantId, params),
    queryFn: () => ownerApi.listBills(restaurantId, params).then((r) => r.data.data.bills ?? []),
    enabled: !!restaurantId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useBill(restaurantId, billId) {
  return useQuery({
    queryKey: billKeys.one(restaurantId, billId),
    queryFn: () => ownerApi.getBill(restaurantId, billId).then((r) => r.data.data),
    enabled: !!restaurantId && !!billId,
    staleTime: 30_000,
  });
}
