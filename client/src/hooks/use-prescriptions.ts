import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertPrescription } from "@shared/schema";
import { authFetch } from "@/lib/auth-fetch";

export function usePrescriptions() {
  return useQuery<any[]>({
    queryKey: [api.prescriptions.list.path],
    queryFn: async () => {
      const res = await authFetch(api.prescriptions.list.path);
      if (!res.ok) throw new Error("Failed to fetch prescriptions");
      return res.json();
    }
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPrescription) => {
      const res = await authFetch(api.prescriptions.create.path, {
        method: api.prescriptions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to issue prescription");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.prescriptions.list.path] });
      toast({ title: "Success", description: "Prescription issued successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}
