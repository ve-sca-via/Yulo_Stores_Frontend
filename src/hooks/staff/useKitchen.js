import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "@/api/staff.api";

export const kitchenKeys = {
  queue: (rId) => ["kitchen", rId, "queue"],
  board: (rId) => ["kitchen", rId, "board"],
  order: (rId, orderId) => ["kitchen", rId, "order", orderId],
};

export function useKitchenQueue(restaurantId) {
  return useQuery({
    queryKey: kitchenKeys.queue(restaurantId),
    queryFn: () => staffApi.getQueue(restaurantId).then((r) => r.data.data.orders ?? []),
    enabled: !!restaurantId,
    refetchInterval: 10_000,
    staleTime: 0,
  });
}

export function useKitchenBoard(restaurantId) {
  return useQuery({
    queryKey: kitchenKeys.board(restaurantId),
    queryFn: () => staffApi.getBoard(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 10_000,
    staleTime: 0,
  });
}

export function useUpdateOrderStatus(restaurantId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, newStatus }) =>
      staffApi.updateOrderStatus(restaurantId, orderId, newStatus),

    onMutate: async ({ orderId, newStatus }) => {
      await qc.cancelQueries({ queryKey: kitchenKeys.board(restaurantId) });
      await qc.cancelQueries({ queryKey: kitchenKeys.queue(restaurantId) });

      const prevBoard = qc.getQueryData(kitchenKeys.board(restaurantId));
      const prevQueue = qc.getQueryData(kitchenKeys.queue(restaurantId));

      // Move order to correct board bucket
      qc.setQueryData(kitchenKeys.board(restaurantId), (old) => {
        if (!old) return old;
        const all = [
          ...(old.preparing ?? []),
          ...(old.ready ?? []),
          ...(old.completed ?? []),
        ].map((o) => (String(o._id) === orderId ? { ...o, status: newStatus } : o));

        return {
          preparing: all.filter((o) => o.status === "preparing"),
          ready:     all.filter((o) => o.status === "ready"),
          completed: all.filter((o) => ["delivered", "out_for_delivery"].includes(o.status)),
        };
      });

      // Remove from queue when chef starts preparing
      if (newStatus === "preparing") {
        qc.setQueryData(kitchenKeys.queue(restaurantId), (old) =>
          (old ?? []).filter((o) => String(o._id) !== orderId),
        );
      }

      return { prevBoard, prevQueue };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prevBoard) qc.setQueryData(kitchenKeys.board(restaurantId), ctx.prevBoard);
      if (ctx?.prevQueue) qc.setQueryData(kitchenKeys.queue(restaurantId), ctx.prevQueue);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: kitchenKeys.board(restaurantId) });
      qc.invalidateQueries({ queryKey: kitchenKeys.queue(restaurantId) });
    },
  });
}
