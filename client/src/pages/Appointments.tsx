import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { useAppointments, useCreateAppointment, useUpdateAppointment, useAnalyzeAppointment } from "@/hooks/use-appointments";
import { useDoctors, useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Video, FileText, Sparkles, ChevronDown, ChevronUp, Loader2, Upload, X, FileImage, Download } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

async function readLabFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) { reject(new Error("File too large. Max 15 MB.")); return; }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxPx = 1600;
          const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale; canvas.height = img.height * scale;
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.88));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject; reader.readAsDataURL(file);
    }
  });
}

export default function AppointmentsPage() {
  const { data: profile } = useProfile();
  const { data: appointments, isLoading } = useAppointments();
  const { data: doctors } = useDoctors();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const analyzeMutation = useAnalyzeAppointment();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [labResultText, setLabResultText] = useState("");
  const [labFile, setLabFile] = useState<{ data: string; name: string } | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  const isDoctor = profile?.role === "doctor";
  const upcoming = appointments?.filter(a => new Date(a.datetime) >= new Date() && a.status !== 'cancelled').sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()) || [];
  const past = appointments?.filter(a => new Date(a.datetime) < new Date() || a.status === 'cancelled').sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()) || [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const data = await readLabFile(file);
      setLabFile({ data, name: file.name });
    } catch (err: any) {
      toast({ title: "File Error", description: err.message, variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !date || !time) return;
    const datetime = new Date(`${date}T${time}`);
    createMutation.mutate(
      {
        doctorId: selectedDoc,
        patientId: profile!.userId,
        datetime,
        labResultText: labResultText || undefined,
        labFileData: labFile?.data,
        labFileName: labFile?.name,
      } as any,
      {
        onSuccess: () => {
          setIsOpen(false);
          setLabResultText(""); setLabFile(null); setSelectedDoc(""); setDate(""); setTime("");
        }
      }
    );
  };

  const handleStatusChange = (id: number, status: string) => { updateMutation.mutate({ id, status }); };

  return (
    <AppLayout>
      <PageHeader
        title="Appointments"
        description="Manage your schedule and consultations."
        action={!isDoctor && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-book-appointment" className="shadow-lg shadow-primary/20 rounded-xl px-6">
                <CalendarIcon className="w-4 h-4 mr-2" /> Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Book Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBook} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Doctor</Label>
                  <Select onValueChange={setSelectedDoc} required>
                    <SelectTrigger data-testid="select-doctor" className="w-full h-12">
                      <SelectValue placeholder="Choose a specialist" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map(doc => (
                        <SelectItem key={doc.user.id} value={doc.user.id}>
                          Dr. {(doc as any).firstName || doc.user.firstName} {(doc as any).lastName || doc.user.lastName} {doc.specialty ? `(${doc.specialty})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input data-testid="input-date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="h-12" min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input data-testid="input-time" type="time" value={time} onChange={e => setTime(e.target.value)} required className="h-12" />
                  </div>
                </div>

                {/* Lab Results Attachment */}
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <FileText className="w-4 h-4" /> Attach Lab Results
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Lab Result Notes</Label>
                    <Textarea
                      data-testid="input-lab-result-text"
                      value={labResultText}
                      onChange={e => setLabResultText(e.target.value)}
                      placeholder="Paste key findings or values..."
                      className="min-h-[70px] text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Upload File (PDF or Image)</Label>
                    {labFile ? (
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-primary/20 px-3 py-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-slate-700 truncate flex-1">{labFile.name}</span>
                        <button type="button" onClick={() => setLabFile(null)} className="text-slate-400 hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid="button-pick-lab-file"
                        onClick={() => fileRef.current?.click()}
                        className="w-full h-14 rounded-lg border border-dashed border-primary/30 bg-white hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-primary/70 text-sm"
                      >
                        <Upload className="w-4 h-4" /> Click to upload PDF, Word, or image
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" data-testid="input-lab-file" onChange={handleFileChange} />
                  </div>
                </div>

                <Button data-testid="button-confirm-booking" type="submit" className="w-full h-12 mt-2" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold font-display text-slate-800 mb-4">Upcoming</h3>
          {upcoming.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {upcoming.map((app) => (
                <AppointmentCard key={app.id} app={app} isDoctor={isDoctor} onStatusChange={handleStatusChange}
                  onAnalyze={(id: number) => analyzeMutation.mutate(id)}
                  isAnalyzing={analyzeMutation.isPending && analyzeMutation.variables === app.id}
                  expandedAnalysis={expandedAnalysis} setExpandedAnalysis={setExpandedAnalysis} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarIcon} title="No upcoming appointments" description="You have no scheduled appointments." />
          )}
        </section>

        <section>
          <h3 className="text-xl font-bold font-display text-slate-800 mb-4">Past & Cancelled</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((app) => (
              <AppointmentCard key={app.id} app={app} isDoctor={isDoctor} minimal expandedAnalysis={expandedAnalysis} setExpandedAnalysis={setExpandedAnalysis} />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function AppointmentCard({ app, isDoctor, onStatusChange, onAnalyze, isAnalyzing, minimal = false, expandedAnalysis, setExpandedAnalysis }: any) {
  const otherUser = isDoctor ? app.patient : app.doctor;
  const isPending = app.status === 'pending';
  const hasLabFile = app.labFileData && app.labFileName;
  const isImageFile = hasLabFile && (app.labFileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || app.labFileData?.startsWith("data:image"));

  return (
    <Card className={`relative overflow-hidden p-0 ${minimal ? 'opacity-80' : ''}`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${app.status === 'cancelled' ? 'bg-destructive' : app.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} />
      <div className="pl-6 pr-5 pt-5 pb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-lg text-slate-900">
              {isDoctor
                ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email
                : `Dr. ${otherUser.firstName} ${otherUser.lastName}`}
            </h4>
            <div className="flex items-center text-sm text-slate-500 mt-1 space-x-3">
              <span className="flex items-center"><CalendarIcon className="w-3.5 h-3.5 mr-1" /> {format(new Date(app.datetime), "MMM d, yyyy")}</span>
              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {format(new Date(app.datetime), "h:mm a")}</span>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide
            ${app.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
              app.status === 'completed' ? 'bg-green-100 text-green-700' :
              isPending ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
            {app.status}
          </span>
        </div>

        {!minimal && app.meetLink && (
          <a href={app.meetLink} target="_blank" rel="noreferrer" data-testid={`link-meet-${app.id}`}
            className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors mb-3 border border-blue-100">
            <Video className="w-4 h-4 mr-2" /> Join Google Meet
          </a>
        )}

        {(app.labResultText || hasLabFile) && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2 mb-3">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Lab Results Attached
            </p>
            {app.labResultText && <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-3">{app.labResultText}</p>}
            {hasLabFile && (
              isImageFile ? (
                <div>
                  <img src={app.labFileData} alt={app.labFileName} className="max-h-32 rounded-lg border border-primary/10 object-contain bg-white" />
                  <a href={app.labFileData} download={app.labFileName} className="text-xs text-primary underline flex items-center gap-1 mt-1">
                    <Download className="w-3 h-3" /> {app.labFileName}
                  </a>
                </div>
              ) : (
                <a href={app.labFileData} download={app.labFileName}
                  className="flex items-center gap-2 text-xs text-primary bg-white rounded-lg border border-primary/10 px-2 py-1.5 hover:bg-primary/5">
                  <FileText className="w-3.5 h-3.5" /> {app.labFileName}
                  <Download className="w-3 h-3 ml-auto" />
                </a>
              )
            )}
          </div>
        )}

        {!minimal && isDoctor && (
          <div className="flex gap-2 pt-2 border-t border-slate-100 mt-1">
            {(app.labResultText || hasLabFile) && (
              <Button size="sm" variant="outline" className="text-violet-600 border-violet-200 hover:bg-violet-50 gap-1.5"
                onClick={() => onAnalyze?.(app.id)} disabled={isAnalyzing} data-testid={`button-analyze-${app.id}`}>
                {isAnalyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3.5 h-3.5" /> {app.aiAnalysis ? 'Re-analyze' : 'Analyze with AI'}</>}
              </Button>
            )}
            {isPending && (
              <>
                <Button size="sm" onClick={() => onStatusChange(app.id, 'confirmed')} className="flex-1" data-testid={`button-confirm-${app.id}`}>Confirm</Button>
                <Button size="sm" variant="outline" onClick={() => onStatusChange(app.id, 'cancelled')} className="flex-1 text-destructive hover:bg-destructive/10" data-testid={`button-cancel-${app.id}`}>Cancel</Button>
              </>
            )}
          </div>
        )}
      </div>

      {app.aiAnalysis && (
        <div className="mx-4 mb-4 rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
            onClick={() => setExpandedAnalysis?.(expandedAnalysis === app.id ? null : app.id)}>
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Pre-Appointment Analysis</span>
            {expandedAnalysis === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedAnalysis === app.id && (
            <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-wrap border-t border-violet-200 pt-3">{app.aiAnalysis}</div>
          )}
        </div>
      )}
    </Card>
  );
}
