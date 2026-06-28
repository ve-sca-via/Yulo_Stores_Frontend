import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "@/api/staff.api";

export const waiterKeys = {
  sessions: (rId) => ["waiter", rId, "sessions"],
  menu:     (rId) => ["waiter", rId, "menu"],
  tables:   (rId) => ["waiter", rId, "tables"],
  bill:     (rId, sessionId) => ["waiter", rId, "bill", sessionId],
};

// ── Active table sessions (orders grouped by table) ──────────────────
export function useWaiterSessions(restaurantId) {
  return useQuery({
    queryKey: waiterKeys.sessions(restaurantId),
    queryFn: () => staffApi.getSessions(restaurantId).then((r) => r.data.data.sessions ?? []),
    enabled: !!restaurantId,
    refetchInterval: 15_000,
    staleTime: 0,
  });
}

// ── Menu for placing orders ──────────────────────────────────────────
export function useWaiterMenu(restaurantId) {
  return useQuery({
    queryKey: waiterKeys.menu(restaurantId),
    queryFn: () => staffApi.getMenu(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000, // menu rarely changes during service
  });
}

// ── Tables list ──────────────────────────────────────────────────────
export function useWaiterTables(restaurantId) {
  return useQuery({
    queryKey: waiterKeys.tables(restaurantId),
    queryFn: () => staffApi.getTables(restaurantId).then((r) => r.data.data.tables ?? []),
    enabled: !!restaurantId,
    staleTime: 60_000,
  });
}

// ── Bill for a session ───────────────────────────────────────────────
export function useSessionBill(restaurantId, sessionId) {
  return useQuery({
    queryKey: waiterKeys.bill(restaurantId, sessionId),
    queryFn: () => staffApi.getBill(restaurantId, sessionId).then((r) => r.data.data),
    enabled: !!restaurantId && !!sessionId,
    staleTime: 30_000,
  });
}

// ── Create order (place new order for a table) ───────────────────────
export function useCreateOrder(restaurantId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body) => staffApi.createOrder(restaurantId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: waiterKeys.sessions(restaurantId) });
    },
  });
}

// ── Mark bill as paid ─────────────────────────────────────────────────
export function useMarkPaid(restaurantId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, paymentMethod }) =>
      staffApi.markPaid(restaurantId, sessionId, paymentMethod),
    onSuccess: (_data, { sessionId }) => {
      qc.invalidateQueries({ queryKey: waiterKeys.sessions(restaurantId) });
      qc.invalidateQueries({ queryKey: waiterKeys.bill(restaurantId, sessionId) });
    },
  });
}

// ── Scan table QR ────────────────────────────────────────────────────
export function useScanTable(restaurantId) {
  return useMutation({
    mutationFn: (qrPayload) => staffApi.scanTable(restaurantId, qrPayload),
  });
}
