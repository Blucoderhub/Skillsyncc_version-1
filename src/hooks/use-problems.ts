import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useProblems(category?: string) {
  return useQuery({
    queryKey: [api.problems.list.path, category],
    queryFn: async () => {
      const url = category 
        ? `${api.problems.list.path}?category=${category}` 
        : api.problems.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch problems");
      return api.problems.list.responses[200].parse(await res.json());
    },
  });
}

export function useProblem(slug: string) {
  return useQuery({
    queryKey: [api.problems.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.problems.get.path, { slug });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch problem");
      return api.problems.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

export function useSubmitCode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, code, language }: { id: number; code: string; language: string }) => {
      const url = buildUrl(api.problems.submit.path, { id });
      const res = await fetch(url, {
        method: api.problems.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Problem not found");
        throw new Error("Failed to submit code");
      }
      
      return api.problems.submit.responses[200].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      // Invalidate user stats to update XP and streak
      queryClient.invalidateQueries({ queryKey: [api.user.stats.path] });
      // Invalidate problems list to show solved status
      queryClient.invalidateQueries({ queryKey: [api.problems.list.path] });
    },
  });
}
