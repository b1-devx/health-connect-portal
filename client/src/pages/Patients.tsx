import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { usePatients, useProfile } from "@/hooks/use-profiles";
import { Users, Phone, Mail, Calendar as CalIcon } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function PatientsPage() {
  const { data: profile } = useProfile();
  const { data: patients, isLoading } = usePatients();
  const [, setLocation] = useLocation();

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  // Redirect if not doctor
  if (profile?.role !== 'doctor') {
    setLocation("/");
    return null;
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Patient Directory" 
        description="View and manage all registered patients."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients?.length ? patients.map((patient) => (
          <Card key={patient.id} className="hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={`https://ui-avatars.com/api/?name=${patient.user.firstName}+${patient.user.lastName}&background=E0F2FE&color=0EA5E9&size=128`} 
                alt="Patient Profile" 
                className="w-16 h-16 rounded-full border-4 border-white shadow-sm"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {patient.user.firstName} {patient.user.lastName}
                </h3>
                <p className="text-sm text-slate-500">Patient ID: #{patient.id.toString().padStart(4, '0')}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              {patient.user.email && (
                <div className="flex items-center text-slate-600">
                  <Mail className="w-4 h-4 mr-3 text-slate-400" />
                  {patient.user.email}
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center text-slate-600">
                  <CalIcon className="w-4 h-4 mr-3 text-slate-400" />
                  DOB: {format(new Date(patient.dateOfBirth), "PP")}
                </div>
              )}
            </div>

            {patient.medicalHistory && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Medical Notes</p>
                <p className="text-sm text-slate-700 line-clamp-3">{patient.medicalHistory}</p>
              </div>
            )}
          </Card>
        )) : (
          <div className="col-span-full">
            <EmptyState icon={Users} title="No patients found" description="There are no patients registered in the system yet." />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
