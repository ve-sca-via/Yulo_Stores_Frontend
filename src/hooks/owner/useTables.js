import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

export const tableKeys = {
  all:  (rId) => ["tables", rId],
  list: (rId) => ["tables", rId, "list"],
};

export function useTables(restaurantId) {
  return useQuery({
    queryKey: tableKeys.list(restaurantId),
    queryFn: () => ownerApi.listTables(restaurantId).then((r) => r.data.data.tables ?? []),
    enabled: !!restaurantId,
    staleTime: 60_000,
  });
}

export function useCreateTable(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => ownerApi.createTable(restaurantId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: tableKeys.all(restaurantId) }),
  });
}

export function useUpdateTable(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, body }) => ownerApi.updateTable(restaurantId, tableId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: tableKeys.all(restaurantId) }),
  });
}

export function useDeleteTable(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId) => ownerApi.deleteTable(restaurantId, tableId),
    onMutate: async (tableId) => {
      await qc.cancelQueries({ queryKey: tableKeys.all(restaurantId) });
      const snap = qc.getQueryData(tableKeys.list(restaurantId));
      qc.setQueryData(tableKeys.list(restaurantId),
        (old) => (old ?? []).filter((t) => t._id !== tableId));
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snap) qc.setQueryData(tableKeys.list(restaurantId), ctx.snap);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: tableKeys.all(restaurantId) }),
  });
}

export function useGenerateQR(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId) => ownerApi.generateQR(restaurantId, tableId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tableKeys.all(restaurantId) }),
  });
}

export function useVoidQR(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId) => ownerApi.voidQR(restaurantId, tableId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tableKeys.all(restaurantId) }),
  });
}
