import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, Button } from "@/components/ui-elements";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useDoctors, usePatients } from "@/hooks/use-profiles";
import { useMessages } from "@/hooks/use-messages";
import { Send, User as UserIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MessagesPage() {
  const { user: authUser } = useAuth();
  const { data: profile } = useProfile();
  const isDoctor = profile?.role === "doctor";
  
  const { data: doctors = [] } = useDoctors();
  const { data: patients = [] } = usePatients();
  
  const contacts = isDoctor ? patients : doctors;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const { messages, sendMessage, isSending } = useMessages(selectedUserId || undefined);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUserId) return;
    sendMessage(messageText);
    setMessageText("");
  };

  const selectedContact = contacts.find(c => c.userId === selectedUserId);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Sidebar - Contacts */}
        <div className="w-80 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h2 className="font-bold text-slate-800">Messages</h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {contacts.map((contact) => (
                  <button
                    key={contact.userId}
                    onClick={() => setSelectedUserId(contact.userId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedUserId === contact.userId 
                        ? "bg-primary text-white" 
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={contact.user.profileImageUrl || ""} />
                      <AvatarFallback className={selectedUserId === contact.userId ? "bg-primary-foreground/20" : ""}>
                        {contact.user.firstName?.[0]}{contact.user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold truncate">
                        {!isDoctor ? "Dr. " : ""}{contact.user.firstName} {contact.user.lastName}
                      </p>
                      {contact.specialty && (
                        <p className={`text-xs truncate ${selectedUserId === contact.userId ? "text-white/70" : "text-slate-500"}`}>
                          {contact.specialty}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
                {contacts.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No contacts found
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col gap-4">
          {selectedUserId ? (
            <Card className="flex-1 flex flex-col p-0 overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={selectedContact?.user.profileImageUrl || ""} />
                  <AvatarFallback>
                    {selectedContact?.user.firstName?.[0]}{selectedContact?.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {!isDoctor ? "Dr. " : ""}{selectedContact?.user.firstName} {selectedContact?.user.lastName}
                  </h3>
                  <span className="text-xs text-green-500 font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" /> Online
                  </span>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 bg-slate-50/30">
                <div className="space-y-4">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === authUser?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                          isMe 
                            ? "bg-primary text-white rounded-tr-none" 
                            : "bg-white text-slate-800 border rounded-tl-none"
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/70" : "text-slate-400"}`}>
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isSending}
                />
                <Button type="submit" disabled={isSending || !messageText.trim()} size="icon">
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="flex-1 flex flex-col items-center justify-center text-center p-8 border-dashed">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Send className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Your Conversations</h3>
              <p className="text-slate-500 max-w-xs">
                Select a {isDoctor ? "patient" : "doctor"} from the list to start messaging directly.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
