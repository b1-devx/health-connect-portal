import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState } from "@/components/ui-elements";
import { useProfile } from "@/hooks/use-profiles";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatientRequests } from "@/hooks/use-requests";
import { Calendar, Activity, Bell, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: appointments = [] } = useAppointments();
  const { data: requests = [] } = useRequestsFiltered();

  const isDoctor = profile?.role === "doctor";
  
  // Minimal custom hook logic to filter requests based on role
  function useRequestsFiltered() {
    const query = usePatientRequests();
    if (!query.data) return query;
    // Assuming backend returns all relevant, if not we filter
    return { ...query, data: query.data.slice(0, 3) }; // Show top 3
  }

  const upcomingAppointments = appointments
    .filter(a => new Date(a.datetime) > new Date() && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 3);

  return (
    <AppLayout>
      <PageHeader 
        title={`Good ${getGreeting()}, ${isDoctor ? 'Dr. ' : ''}${profile?.user?.firstName}`} 
        description="Here is your health overview for today."
      />

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-primary to-teal-500 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white/80">Upcoming Appointments</h3>
            <div className="p-2 bg-white/20 rounded-lg"><Calendar className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-4xl font-display font-bold">{upcomingAppointments.length}</p>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-500">Active Requests</h3>
            <div className="p-2 bg-accent/10 rounded-lg"><Bell className="w-5 h-5 text-accent" /></div>
          </div>
          <p className="text-4xl font-display font-bold text-slate-800">
            {requests.filter(r => r.status === 'pending').length}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-500">{isDoctor ? 'Patients Seen' : 'Recent Labs'}</h3>
            <div className="p-2 bg-blue-100 rounded-lg"><Activity className="w-5 h-5 text-blue-600" /></div>
          </div>
          <p className="text-4xl font-display font-bold text-slate-800">
            {isDoctor ? '12' : '2'}
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-slate-800">Upcoming Appointments</h2>
            <Link href="/appointments" className="text-sm font-medium text-primary hover:underline flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((app) => (
                <Card key={app.id} className="p-5 flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl text-center min-w-[70px] border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase">{format(new Date(app.datetime), "MMM")}</p>
                    <p className="text-xl font-display font-bold text-primary">{format(new Date(app.datetime), "d")}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-lg">
                      {isDoctor ? `${app.patient.firstName} ${app.patient.lastName}` : `Dr. ${app.doctor.firstName} ${app.doctor.lastName}`}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center mt-1">
                      <Clock className="w-3.5 h-3.5 mr-1" /> {format(new Date(app.datetime), "h:mm a")}
                    </p>
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full capitalize">
                      {app.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Calendar} 
              title="No upcoming appointments" 
              description="Your schedule is clear. Book an appointment when you're ready." 
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-slate-800">Recent Requests</h2>
            <Link href="/requests" className="text-sm font-medium text-primary hover:underline flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id} className="p-5 border-l-4 border-l-accent">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">
                      {req.type}
                    </span>
                    <span className={`text-xs font-bold capitalize ${req.status === 'pending' ? 'text-amber-500' : 'text-green-500'}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium mb-1 line-clamp-1">{req.description}</p>
                  <p className="text-xs text-slate-400">{format(new Date(req.createdAt), "MMM d, yyyy")}</p>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Bell} 
              title="No pending requests" 
              description="You don't have any active requests at the moment." 
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function Clock(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
