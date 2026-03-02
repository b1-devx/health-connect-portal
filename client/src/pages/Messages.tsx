import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { Card } from "@/components/ui-elements";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useDoctors, usePatients } from "@/hooks/use-profiles";
import { useMessages } from "@/hooks/use-messages";
import { Send, User as UserIcon, Loader2, Paperclip, X, FileText, FileImage, Download } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

async function processFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error("File is too large. Maximum size is 10 MB."));
      return;
    }
    if (file.type.startsWith("image/")) {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const maxPx = 1200;
          const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

function fileIcon(type: string) {
  if (type?.startsWith("image/")) return <FileImage className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

function AttachmentBubble({ data, name, type, isMe }: { data: string; name: string; type: string; isMe: boolean }) {
  if (type?.startsWith("image/")) {
    return (
      <div className="mt-2">
        <img src={data} alt={name} className="max-w-[260px] rounded-xl border shadow-sm" />
        <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-slate-400"}`}>{name}</p>
      </div>
    );
  }
  return (
    <a
      href={data}
      download={name}
      className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors
        ${isMe ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
    >
      {fileIcon(type)}
      <span className="truncate max-w-[180px]">{name}</span>
      <Download className="w-3.5 h-3.5 shrink-0 ml-auto opacity-70" />
    </a>
  );
}

export default function MessagesPage() {
  const { user: authUser } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const isDoctor = profile?.role === "doctor";

  const { data: doctors = [] } = useDoctors();
  const { data: patients = [] } = usePatients();

  const contacts = isDoctor ? patients : doctors;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { messages, sendMessage, isSending } = useMessages(selectedUserId || undefined);
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<{ data: string; name: string; type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await processFile(file);
      setAttachment({ data, name: file.name, type: file.type });
    } catch (err: any) {
      toast({ title: "File Error", description: err.message || "Could not read file.", variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachment) || !selectedUserId) return;
    sendMessage({
      content: messageText.trim(),
      attachmentData: attachment?.data,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    });
    setMessageText("");
    setAttachment(null);
  };

  const selectedContact = contacts.find(c => c.userId === selectedUserId);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-10rem)] gap-4">

        {/* Contact List */}
        <div className="w-72 flex flex-col gap-3 shrink-0">
          <Card className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h2 className="font-bold text-slate-800">Conversations</h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {contacts.map((contact) => {
                  const displayFirst = (contact as any).firstName || contact.user.firstName || "";
                  const displayLast = (contact as any).lastName || contact.user.lastName || "";
                  const photo = (contact as any).profilePhotoUrl || contact.user.profileImageUrl;
                  const isSelected = selectedUserId === contact.userId;
                  return (
                    <button
                      key={contact.userId}
                      data-testid={`contact-${contact.userId}`}
                      onClick={() => setSelectedUserId(contact.userId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        isSelected ? "bg-primary text-white" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {photo ? (
                          <img src={photo} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm ${isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                            {displayFirst?.[0]}{displayLast?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold truncate text-sm">
                          {!isDoctor ? "Dr. " : ""}{displayFirst} {displayLast}
                        </p>
                        {(contact as any).specialty && (
                          <p className={`text-xs truncate ${isSelected ? "text-white/70" : "text-slate-400"}`}>
                            {(contact as any).specialty}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
                {contacts.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">No contacts available.</div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedUserId ? (
            <Card className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center gap-3 shrink-0">
                {(() => {
                  const displayFirst = (selectedContact as any)?.firstName || selectedContact?.user.firstName || "";
                  const displayLast = (selectedContact as any)?.lastName || selectedContact?.user.lastName || "";
                  const photo = (selectedContact as any)?.profilePhotoUrl || selectedContact?.user.profileImageUrl;
                  return (
                    <>
                      {photo ? (
                        <img src={photo} alt="" className="w-9 h-9 rounded-full object-cover border shadow-sm" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {displayFirst?.[0]}{displayLast?.[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight">
                          {!isDoctor ? "Dr. " : ""}{displayFirst} {displayLast}
                        </h3>
                        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 bg-slate-50/40">
                <div className="p-4 space-y-3">
                  {messages.map((msg: any) => {
                    const isMe = msg.senderId === authUser?.id;
                    const hasAttachment = msg.attachmentData && msg.attachmentName;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          isMe ? "bg-primary text-white rounded-tr-sm" : "bg-white text-slate-800 border rounded-tl-sm"
                        }`}>
                          {msg.content && (
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          )}
                          {hasAttachment && (
                            <AttachmentBubble
                              data={msg.attachmentData}
                              name={msg.attachmentName}
                              type={msg.attachmentType || ""}
                              isMe={isMe}
                            />
                          )}
                          <p className={`text-[10px] mt-1.5 ${isMe ? "text-white/60 text-right" : "text-slate-400"}`}>
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Attachment preview strip */}
              {attachment && (
                <div className="px-4 py-2 border-t bg-white flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 flex-1 min-w-0">
                    {fileIcon(attachment.type)}
                    <span className="text-sm text-slate-700 truncate">{attachment.name}</span>
                  </div>
                  <button
                    onClick={() => setAttachment(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Composer */}
              <form onSubmit={handleSend} className="p-3 border-t bg-white flex items-center gap-2">
                <button
                  type="button"
                  data-testid="button-attach-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                  title="Attach file (PDF, Word, image)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="hidden"
                  data-testid="input-attachment"
                  onChange={handleFileChange}
                />
                <Input
                  data-testid="input-message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                  disabled={isSending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                />
                <button
                  type="submit"
                  data-testid="button-send"
                  disabled={isSending || (!messageText.trim() && !attachment)}
                  className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </Card>
          ) : (
            <Card className="flex-1 flex flex-col items-center justify-center text-center p-8 border-dashed">
              <div className="bg-slate-100 p-6 rounded-full mb-4">
                <Send className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Select a conversation</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                Choose a {isDoctor ? "patient" : "doctor"} from the left to start messaging. You can send text, images, PDFs, and Word documents.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
