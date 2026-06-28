import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

export const settingsKeys = {
  all:      (rId) => ["settings", rId],
  main:     (rId) => ["settings", rId, "main"],
  hours:    (rId) => ["settings", rId, "hours"],
  delivery: (rId) => ["settings", rId, "delivery"],
};

export function useSettings(restaurantId) {
  return useQuery({
    queryKey: settingsKeys.main(restaurantId),
    queryFn: () => ownerApi.getSettings(restaurantId).then((r) => r.data.data.restaurant),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => ownerApi.updateSettings(restaurantId, body),
    onSuccess: ({ data }) => {
      // Response shape: { status, message, data: { restaurant: {...} } }
      const restaurant = data.data?.restaurant;
      if (restaurant) qc.setQueryData(settingsKeys.main(restaurantId), restaurant);
    },
  });
}

export function useUpdateHours(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => ownerApi.updateHours(restaurantId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all(restaurantId) }),
  });
}

export function useUpdateDelivery(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => ownerApi.updateDelivery(restaurantId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all(restaurantId) }),
  });
}

export function useHours(restaurantId) {
  return useQuery({
    queryKey: settingsKeys.hours(restaurantId),
    queryFn: () => ownerApi.getHours(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000,
  });
}

export function useDeliverySettings(restaurantId) {
  return useQuery({
    queryKey: settingsKeys.delivery(restaurantId),
    queryFn: () => ownerApi.getDelivery(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000,
  });
}
