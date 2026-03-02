import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertProfile, Profile } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/auth-utils";

type ProfileWithUser = Profile & { user: any };

export function useProfile() {
  return useQuery<ProfileWithUser | null>({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    retry: false,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProfile) => {
      const res = await fetch(api.profiles.create.path, {
        method: api.profiles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
      toast({ title: "Success", description: "Profile created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useDoctors() {
  return useQuery<ProfileWithUser[]>({
    queryKey: [api.profiles.doctors.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.doctors.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch doctors");
      return res.json();
    }
  });
}

export function usePatients() {
  return useQuery<ProfileWithUser[]>({
    queryKey: [api.profiles.patients.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.patients.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    }
  });
}
