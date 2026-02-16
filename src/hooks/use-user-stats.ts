import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useUserStats() {
  return useQuery({
    queryKey: [api.user.stats.path],
    queryFn: async () => {
      const res = await fetch(api.user.stats.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user stats");
      return api.user.stats.responses[200].parse(await res.json());
    },
  });
}
