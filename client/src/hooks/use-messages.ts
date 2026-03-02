import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

export function useMessages(otherUserId?: string) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { otherUserId: otherUserId || "" })],
    queryFn: async () => {
      if (!otherUserId) return [];
      const res = await fetch(buildUrl(api.messages.list.path, { otherUserId }));
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!otherUserId,
    refetchInterval: 3000, // Poll every 3 seconds for simple real-time
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!otherUserId) throw new Error("No recipient selected");
      return apiRequest("POST", api.messages.create.path, {
        receiverId: otherUserId,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [buildUrl(api.messages.list.path, { otherUserId: otherUserId || "" })] 
      });
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
}
