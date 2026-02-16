import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useHackathons() {
  return useQuery({
    queryKey: [api.hackathons.list.path],
    queryFn: async () => {
      const res = await fetch(api.hackathons.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch hackathons");
      return api.hackathons.list.responses[200].parse(await res.json());
    },
  });
}
