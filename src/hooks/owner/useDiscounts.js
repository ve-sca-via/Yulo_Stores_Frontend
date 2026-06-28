import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

export const discountKeys = {
  all:  (rId) => ["discounts", rId],
  list: (rId) => ["discounts", rId, "list"],
};

export function useDiscounts(restaurantId) {
  return useQuery({
    queryKey: discountKeys.list(restaurantId),
    queryFn: () => ownerApi.listDiscounts(restaurantId).then((r) => r.data.data.discounts ?? []),
    enabled: !!restaurantId,
    staleTime: 60_000,
  });
}

export function useCreateDiscount(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => ownerApi.createDiscount(restaurantId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: discountKeys.all(restaurantId) }),
  });
}

export function useUpdateDiscount(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dId, body }) => ownerApi.updateDiscount(restaurantId, dId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: discountKeys.all(restaurantId) }),
  });
}

export function useDeleteDiscount(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dId) => ownerApi.deleteDiscount(restaurantId, dId),
    onMutate: async (dId) => {
      await qc.cancelQueries({ queryKey: discountKeys.all(restaurantId) });
      const snap = qc.getQueryData(discountKeys.list(restaurantId));
      qc.setQueryData(discountKeys.list(restaurantId),
        (old) => (old ?? []).filter((d) => d._id !== dId));
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snap) qc.setQueryData(discountKeys.list(restaurantId), ctx.snap);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: discountKeys.all(restaurantId) }),
  });
}

export function usePublishDiscount(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dId) => ownerApi.publishDiscount(restaurantId, dId),
    onSuccess: () => qc.invalidateQueries({ queryKey: discountKeys.all(restaurantId) }),
  });
}

export function useDraftDiscount(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dId) => ownerApi.draftDiscount(restaurantId, dId),
    onSuccess: () => qc.invalidateQueries({ queryKey: discountKeys.all(restaurantId) }),
  });
}
