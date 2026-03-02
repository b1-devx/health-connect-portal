import { AppLayout } from "@/components/layout";
import { PageHeader, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { useDoctors, useProfile } from "@/hooks/use-profiles";
import { Stethoscope, Phone, Mail, BadgeCheck, MessageSquare, CalendarPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DoctorsPage() {
  const { data: profile } = useProfile();
  const { data: doctors, isLoading } = useDoctors();
  const [, setLocation] = useLocation();

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  if (profile?.role !== "patient") {
    setLocation("/");
    return null;
  }

  return (
    <AppLayout>
      <PageHeader
        title="Our Doctors"
        description="Browse our team of medical professionals and book an appointment."
      />

      {doctors?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => {
            const displayFirst = doc.firstName || doc.user.firstName || "";
            const displayLast = doc.lastName || doc.user.lastName || "";
            const fullName = `${displayFirst} ${displayLast}`.trim() || doc.user.email;
            const photo = doc.profilePhotoUrl || doc.user.profileImageUrl;
            const avatarUrl = `https://ui-avatars.com/api/?name=${displayFirst}+${displayLast}&background=EFF6FF&color=3B82F6&size=256`;

            return (
              <div
                key={doc.id}
                data-testid={`card-doctor-${doc.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Photo banner */}
                <div className="relative h-40 bg-gradient-to-br from-primary/10 to-teal-400/10 flex items-center justify-center">
                  {photo ? (
                    <img
                      src={photo}
                      alt={`Dr. ${fullName}`}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center">
                      <User className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  {doc.specialty && (
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                      {doc.specialty}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold font-display text-slate-900 text-center mb-1">
                    Dr. {fullName}
                  </h3>

                  <div className="space-y-2 mt-3 text-sm text-slate-600">
                    {doc.licenseNumber && (
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                        <span>PRC No. {doc.licenseNumber}</span>
                      </div>
                    )}
                    {(doc.phone || doc.user.email) && (
                      <>
                        {doc.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{doc.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.user.email}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 rounded-xl"
                      onClick={() => setLocation("/appointments")}
                      data-testid={`button-book-${doc.id}`}
                    >
                      <CalendarPlus className="w-4 h-4" /> Book
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 rounded-xl"
                      onClick={() => setLocation("/messages")}
                      data-testid={`button-message-${doc.id}`}
                    >
                      <MessageSquare className="w-4 h-4" /> Message
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Stethoscope}
          title="No doctors available"
          description="No doctors are registered in the system yet. Please check back later."
        />
      )}
    </AppLayout>
  );
}
