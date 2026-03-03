import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Message } from "@shared/schema";
import { authFetch } from "@/lib/auth-fetch";

export interface MessagePayload {
  content: string;
  attachmentData?: string;
  attachmentName?: string;
  attachmentType?: string;
}

export function useMessages(otherUserId?: string) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { otherUserId: otherUserId || "" })],
    queryFn: async () => {
      if (!otherUserId) return [];
      const res = await authFetch(buildUrl(api.messages.list.path, { otherUserId }));
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!otherUserId,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: MessagePayload) => {
      if (!otherUserId) throw new Error("No recipient selected");
      const res = await authFetch(api.messages.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: payload.content,
          attachmentData: payload.attachmentData,
          attachmentName: payload.attachmentName,
          attachmentType: payload.attachmentType,
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [buildUrl(api.messages.list.path, { otherUserId: otherUserId || "" })],
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
