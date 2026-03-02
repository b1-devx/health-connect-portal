import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { usePrescriptions, useCreatePrescription } from "@/hooks/use-prescriptions";
import { usePatients, useProfile, useDoctors } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Plus, Eye, Printer, Building2, Phone, BadgeCheck, User } from "lucide-react";
import { format } from "date-fns";

export default function PrescriptionsPage() {
  const { data: profile } = useProfile();
  const { data: prescriptions, isLoading } = usePrescriptions();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const createMutation = useCreatePrescription();

  const [isOpen, setIsOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [viewRx, setViewRx] = useState<any | null>(null);

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  const isDoctor = profile?.role === "doctor";

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !medication || !dosage || !instructions) return;
    createMutation.mutate(
      { doctorId: profile!.userId, patientId, medication, dosage, instructions },
      {
        onSuccess: () => {
          setIsOpen(false);
          setMedication(""); setDosage(""); setInstructions(""); setPatientId("");
        }
      }
    );
  };

  const getDoctorProfile = (doctorUserId: string) => {
    return doctors?.find(d => d.userId === doctorUserId) || (isDoctor ? profile : null);
  };

  const displayName = (p: any) => {
    if (!p) return "";
    const fn = (p as any).firstName || p.user?.firstName || "";
    const ln = (p as any).lastName || p.user?.lastName || "";
    return `${fn} ${ln}`.trim();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Prescriptions"
        description="Active and past medication records."
        action={isDoctor && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-issue-prescription" className="shadow-lg shadow-primary/20 rounded-xl px-6">
                <Plus className="w-4 h-4 mr-2" /> Issue Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">New Prescription</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleIssue} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Patient</Label>
                  <Select onValueChange={setPatientId} required>
                    <SelectTrigger data-testid="select-patient" className="w-full h-12">
                      <SelectValue placeholder="Choose a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.user.id} value={p.user.id}>
                          {(p as any).firstName || p.user.firstName} {(p as any).lastName || p.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Medication Name</Label>
                  <Input data-testid="input-medication" value={medication} onChange={e => setMedication(e.target.value)} required className="h-12" placeholder="e.g. Amoxicillin" />
                </div>
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input data-testid="input-dosage" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg twice daily" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea data-testid="input-instructions" value={instructions} onChange={e => setInstructions(e.target.value)} required className="min-h-[100px]" placeholder="Directions for use..." />
                </div>
                <Button data-testid="button-submit-prescription" type="submit" className="w-full h-12" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Issuing..." : "Issue Prescription"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      {/* Prescription View Dialog */}
      {viewRx && (
        <Dialog open={!!viewRx} onOpenChange={() => setViewRx(null)}>
          <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden">
            <div className="bg-white" data-testid="prescription-document">
              {/* Header / Letterhead */}
              {(() => {
                const docProfile = getDoctorProfile(viewRx.doctorId);
                const docFirst = (docProfile as any)?.firstName || viewRx.doctor?.firstName || "";
                const docLast = (docProfile as any)?.lastName || viewRx.doctor?.lastName || "";
                const clinicLogo = (docProfile as any)?.clinicLogoData;
                const signature = (docProfile as any)?.signatureData;
                const specialty = (docProfile as any)?.specialty || "";
                const license = (docProfile as any)?.licenseNumber || "";
                const clinicAddr = (docProfile as any)?.clinicAddress || (docProfile as any)?.address || "";
                const clinicPhone = (docProfile as any)?.clinicPhone || (docProfile as any)?.phone || "";
                const patFirst = (viewRx as any).patientFirst || viewRx.patient?.firstName || "";
                const patLast = (viewRx as any).patientLast || viewRx.patient?.lastName || "";

                return (
                  <>
                    {/* Letterhead */}
                    <div className="border-b-4 border-primary p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {clinicLogo ? (
                            <img src={clinicLogo} alt="Clinic Logo" className="w-20 h-20 object-contain rounded-xl border border-slate-100 shadow-sm" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                              <Building2 className="w-8 h-8 text-primary" />
                            </div>
                          )}
                          <div>
                            <h2 className="text-2xl font-display font-bold text-primary">Dr. {docFirst} {docLast}</h2>
                            {specialty && <p className="text-slate-600 font-medium">{specialty}</p>}
                            {license && (
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                <BadgeCheck className="w-3.5 h-3.5" /> PRC License No. {license}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-slate-500 space-y-1 shrink-0">
                          {clinicAddr && (
                            <p className="flex items-center justify-end gap-1">
                              <Building2 className="w-3.5 h-3.5" /> {clinicAddr}
                            </p>
                          )}
                          {clinicPhone && (
                            <p className="flex items-center justify-end gap-1">
                              <Phone className="w-3.5 h-3.5" /> {clinicPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between text-sm">
                      <div>
                        <span className="text-slate-500">Patient: </span>
                        <span className="font-semibold text-slate-900">{patFirst} {patLast}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Date: </span>
                        <span className="font-semibold text-slate-900">{format(new Date(viewRx.issuedAt), "MMMM d, yyyy")}</span>
                      </div>
                    </div>

                    {/* Rx Body */}
                    <div className="px-6 py-6">
                      <div className="text-5xl font-serif text-primary/30 leading-none mb-4">℞</div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Medication</p>
                          <p className="text-xl font-bold text-slate-900 font-display">{viewRx.medication}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Dosage</p>
                          <p className="text-lg font-semibold text-primary">{viewRx.dosage}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">Instructions</p>
                          <p className="text-slate-700 leading-relaxed">{viewRx.instructions}</p>
                        </div>
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="px-6 pb-6 flex justify-end">
                      <div className="text-right">
                        {signature ? (
                          <img src={signature} alt="Signature" className="max-h-20 max-w-[200px] object-contain mb-1" />
                        ) : (
                          <div className="h-12 w-44 border-b-2 border-slate-400 mb-1" />
                        )}
                        <p className="text-sm font-bold text-slate-800">Dr. {docFirst} {docLast}</p>
                        {specialty && <p className="text-xs text-slate-500">{specialty}</p>}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewRx(null)}>Close</Button>
              <Button onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" /> Print</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prescriptions?.length ? prescriptions.map((rx: any) => (
          <Card key={rx.id} className="relative overflow-hidden border-t-4 border-t-primary flex flex-col" data-testid={`card-prescription-${rx.id}`}>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-xl font-display text-slate-900">{rx.medication}</h4>
                <div className="p-2 bg-primary/10 rounded-full shrink-0 ml-2">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-primary font-semibold text-lg mb-3">{rx.dosage}</p>
              <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm text-slate-700 border border-slate-100">
                <p className="font-bold mb-1 text-slate-900 text-xs uppercase tracking-wider">Instructions</p>
                {rx.instructions}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {isDoctor
                    ? `${(rx.patient as any)?.firstName || rx.patient?.firstName || ""} ${(rx.patient as any)?.lastName || rx.patient?.lastName || ""}`.trim() || rx.patient?.email
                    : `Dr. ${rx.doctor?.firstName} ${rx.doctor?.lastName}`}
                </span>
                <span>{format(new Date(rx.issuedAt), "MMM d, yyyy")}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 text-primary border-primary/20 hover:bg-primary/5"
                onClick={() => setViewRx(rx)}
                data-testid={`button-view-rx-${rx.id}`}
              >
                <Eye className="w-4 h-4" /> View Full Prescription
              </Button>
            </div>
          </Card>
        )) : (
          <div className="col-span-full">
            <EmptyState icon={Pill} title="No prescriptions" description="No prescriptions on record yet." />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
