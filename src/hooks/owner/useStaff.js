import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/api/owner.api";

const staffKeys = {
  all: (rId) => ["staff", rId],
};

export function useStaff(restaurantId) {
  return useQuery({
    queryKey: staffKeys.all(restaurantId),
    queryFn: () => ownerApi.listStaff(restaurantId).then((r) => r.data.data.staff ?? []),
    enabled: !!restaurantId,
  });
}

export function useCreateStaff(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => ownerApi.createStaff(restaurantId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all(restaurantId) }),
  });
}

export function useUpdateStaff(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, ...body }) => ownerApi.updateStaff(restaurantId, staffId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all(restaurantId) }),
  });
}

export function useRemoveStaff(restaurantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (staffId) => ownerApi.removeStaff(restaurantId, staffId),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all(restaurantId) }),
  });
}
