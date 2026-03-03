import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertPatientRequest } from "@shared/schema";
import { authFetch } from "@/lib/auth-fetch";

export function usePatientRequests() {
  return useQuery<any[]>({
    queryKey: [api.patientRequests.list.path],
    queryFn: async () => {
      const res = await authFetch(api.patientRequests.list.path);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json();
    }
  });
}

export function useCreatePatientRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPatientRequest) => {
      const res = await authFetch(api.patientRequests.create.path, {
        method: api.patientRequests.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.patientRequests.list.path] });
      toast({ title: "Success", description: "Request submitted successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdatePatientRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const url = buildUrl(api.patientRequests.update.path, { id });
      const res = await authFetch(url, {
        method: api.patientRequests.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.patientRequests.list.path] });
      toast({ title: "Success", description: "Request status updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useAnalyzeRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/requests/${id}/analyze`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to run analysis");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.patientRequests.list.path] });
      toast({ title: "Analysis Complete", description: "AI analysis has been generated." });
    },
    onError: (error: Error) => {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    }
  });
}
