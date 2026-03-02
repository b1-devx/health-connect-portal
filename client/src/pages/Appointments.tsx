import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { useAppointments, useCreateAppointment, useUpdateAppointment } from "@/hooks/use-appointments";
import { useDoctors, useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Video, FileText } from "lucide-react";
import { format } from "date-fns";

export default function AppointmentsPage() {
  const { data: profile } = useProfile();
  const { data: appointments, isLoading } = useAppointments();
  const { data: doctors } = useDoctors();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  const isDoctor = profile?.role === "doctor";
  const upcoming = appointments?.filter(a => new Date(a.datetime) >= new Date() && a.status !== 'cancelled').sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()) || [];
  const past = appointments?.filter(a => new Date(a.datetime) < new Date() || a.status === 'cancelled').sort((a,b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()) || [];

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !date || !time) return;
    
    // Combine date and time
    const datetime = new Date(`${date}T${time}`).toISOString();
    
    createMutation.mutate(
      { doctorId: selectedDoc, patientId: profile!.userId, datetime },
      { onSuccess: () => setIsOpen(false) }
    );
  };

  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, status });
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Appointments" 
        description="Manage your schedule and consultations."
        action={!isDoctor && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 rounded-xl px-6">
                <CalendarIcon className="w-4 h-4 mr-2" /> Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Book Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBook} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Doctor</Label>
                  <Select onValueChange={setSelectedDoc} required>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Choose a specialist" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map(doc => (
                        <SelectItem key={doc.user.id} value={doc.user.id}>
                          Dr. {doc.user.firstName} {doc.user.lastName} {doc.specialty ? `(${doc.specialty})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="h-12" min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} required className="h-12" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 mt-4" disabled={createMutation.isPending}>
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
                <AppointmentCard 
                  key={app.id} 
                  app={app} 
                  isDoctor={isDoctor} 
                  onStatusChange={handleStatusChange}
                />
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
              <AppointmentCard key={app.id} app={app} isDoctor={isDoctor} minimal />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function AppointmentCard({ app, isDoctor, onStatusChange, minimal = false }: any) {
  const otherUser = isDoctor ? app.patient : app.doctor;
  const isPending = app.status === 'pending';
  
  return (
    <Card className={`relative overflow-hidden ${minimal ? 'opacity-75' : ''}`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${app.status === 'cancelled' ? 'bg-destructive' : app.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-lg text-slate-900">
            {isDoctor ? `${otherUser.firstName} ${otherUser.lastName}` : `Dr. ${otherUser.firstName} ${otherUser.lastName}`}
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
        <a href={app.meetLink} target="_blank" rel="noreferrer" className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors mb-4 border border-blue-100">
          <Video className="w-4 h-4 mr-2" /> Join Google Meet
        </a>
      )}

      {!minimal && isDoctor && isPending && onStatusChange && (
        <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
          <Button size="sm" onClick={() => onStatusChange(app.id, 'confirmed')} className="flex-1">Confirm</Button>
          <Button size="sm" variant="outline" onClick={() => onStatusChange(app.id, 'cancelled')} className="flex-1 text-destructive hover:bg-destructive/10">Cancel</Button>
        </div>
      )}
      
      {minimal && app.notes && (
        <p className="text-sm text-slate-600 mt-3 flex items-start bg-slate-50 p-2 rounded-lg">
          <FileText className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2">{app.notes}</span>
        </p>
      )}
    </Card>
  );
}
