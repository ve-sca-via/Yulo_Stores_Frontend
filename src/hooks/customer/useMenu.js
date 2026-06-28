import { useQuery } from "@tanstack/react-query";
import { customerApi } from "@/api/customer.api";

export const menuKeys = {
  menu:       (rId) => ["customer-menu", rId],
  restaurant: (rId) => ["customer-restaurant", rId],
  reviews:    (rId) => ["customer-reviews", rId],
};

// Public restaurant menu — no auth required
export function useRestaurantMenu(restaurantId) {
  return useQuery({
    queryKey: menuKeys.menu(restaurantId),
    queryFn: () => customerApi.getMenu(restaurantId).then((r) => r.data.data),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000,
  });
}

export function useRestaurant(restaurantId) {
  return useQuery({
    queryKey: menuKeys.restaurant(restaurantId),
    queryFn: () => customerApi.getRestaurant(restaurantId).then((r) => r.data.data.restaurant),
    enabled: !!restaurantId,
    staleTime: 10 * 60_000,
  });
}

export function useRestaurantReviews(restaurantId, params={}) {
  return useQuery({
    queryKey: [...menuKeys.reviews(restaurantId), params],
    queryFn: () => customerApi.getReviews(restaurantId, params).then((r) => r.data.data),
    enabled: !!restaurantId,
    staleTime: 5 * 60_000,
  });
}
