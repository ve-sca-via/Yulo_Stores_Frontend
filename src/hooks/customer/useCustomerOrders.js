import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerApi } from "@/api/customer.api";

export const customerOrderKeys = {
  all:  () => ["customer-orders"],
  list: (p={}) => ["customer-orders", "list", p],
  one:  (id)   => ["customer-orders", "order", id],
};

export function useCustomerOrders(params={}, options={}) {
  return useQuery({
    queryKey: customerOrderKeys.list(params),
    queryFn: () => customerApi.listOrders(params).then((r) => r.data.data.orders ?? []),
    staleTime: 30_000,
    ...options,
  });
}

// Single order — used for live polling on OrderStatus page
export function useCustomerOrder(orderId, { pollInterval = 0 } = {}) {
  return useQuery({
    queryKey: customerOrderKeys.one(orderId),
    queryFn: () => customerApi.getOrder(orderId).then((r) => r.data.data.order ?? r.data.data),
    enabled: !!orderId,
    refetchInterval: pollInterval || false,
    staleTime: 0,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => customerApi.createOrder(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerOrderKeys.all() }),
  });
}

// ── User profile ──────────────────────────────────────────────────────
export const profileKeys = {
  me: () => ["user-profile"],
};

export function useUserProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => customerApi.getMe().then((r) => r.data.data.user ?? r.data.data),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => customerApi.updateMe(body),
    onSuccess: ({ data }) => {
      qc.setQueryData(profileKeys.me(), data.data.user ?? data.data);
    },
  });
}
