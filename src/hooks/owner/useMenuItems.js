import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

export const menuItemKeys = {
  all:  (rId)        => ["menu-items", rId],
  list: (rId, p={}) => ["menu-items", rId, "list", p],
  one:  (rId, id)   => ["menu-items", rId, "item", id],
};

export function useMenuItems(restaurantId, params={}) {
  return useQuery({
    queryKey: menuItemKeys.list(restaurantId, params),
    queryFn: () => ownerApi.listMenuItems(restaurantId, params).then((r) => r.data.data.items ?? []),
    enabled: !!restaurantId,
    staleTime: 60_000,
  });
}

export function useMenuItem(restaurantId, itemId) {
  return useQuery({
    queryKey: menuItemKeys.one(restaurantId, itemId),
    queryFn: () => ownerApi.getMenuItem(restaurantId, itemId).then((r) => r.data.data),
    enabled: !!restaurantId && !!itemId,
  });
}

export function useToggleMenuItem(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => ownerApi.toggleMenuItem(restaurantId, itemId),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: menuItemKeys.all(restaurantId) });
      const snap = qc.getQueriesData({ queryKey: menuItemKeys.all(restaurantId) });
      // Optimistically flip `available` flag in all cached list queries
      qc.setQueriesData({ queryKey: menuItemKeys.all(restaurantId) }, (old) => {
        if (!old) return old;
        const toggle = (items) =>
          items.map((i) => i._id === itemId ? { ...i, isAvailable: !i.isAvailable } : i);
        if (Array.isArray(old)) return toggle(old);
        if (old.items) return { ...old, items: toggle(old.items) };
        return old;
      });
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snap?.forEach(([key, val]) => qc.setQueryData(key, val));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: menuItemKeys.all(restaurantId) }),
  });
}

export function useCreateMenuItem(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => ownerApi.createMenuItem(restaurantId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuItemKeys.all(restaurantId) }),
  });
}

export function useUpdateMenuItem(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, formData }) => ownerApi.updateMenuItem(restaurantId, itemId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuItemKeys.all(restaurantId) }),
  });
}

export function useDeleteMenuItem(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => ownerApi.deleteMenuItem(restaurantId, itemId),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: menuItemKeys.all(restaurantId) });
      const snap = qc.getQueriesData({ queryKey: menuItemKeys.all(restaurantId) });
      qc.setQueriesData({ queryKey: menuItemKeys.all(restaurantId) }, (old) => {
        if (!old) return old;
        const remove = (items) => items.filter((i) => i._id !== itemId);
        if (Array.isArray(old)) return remove(old);
        if (old.items) return { ...old, items: remove(old.items) };
        return old;
      });
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snap?.forEach(([key, val]) => qc.setQueryData(key, val));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: menuItemKeys.all(restaurantId) }),
  });
}

// ── Categories ────────────────────────────────────────────────────────
export const categoryKeys = {
  all:  (rId) => ["categories", rId],
  list: (rId) => ["categories", rId, "list"],
};

export function useCategories(restaurantId) {
  return useQuery({
    queryKey: categoryKeys.list(restaurantId),
    queryFn: () => ownerApi.listCategories(restaurantId).then((r) => r.data.data.categories ?? []),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateCategory(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => ownerApi.createCategory(restaurantId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all(restaurantId) }),
  });
}

export function useDeleteCategory(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cId) => ownerApi.deleteCategory(restaurantId, cId),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all(restaurantId) }),
  });
}
