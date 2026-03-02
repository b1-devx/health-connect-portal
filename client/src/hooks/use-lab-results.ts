import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertLabResult } from "@shared/schema";

export function useLabResults() {
  return useQuery<any[]>({
    queryKey: [api.labResults.list.path],
    queryFn: async () => {
      const res = await fetch(api.labResults.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch lab results");
      return res.json();
    }
  });
}

export function useCreateLabResult() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertLabResult) => {
      const res = await fetch(api.labResults.create.path, {
        method: api.labResults.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add lab result");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.labResults.list.path] });
      toast({ title: "Success", description: "Lab result added." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}
