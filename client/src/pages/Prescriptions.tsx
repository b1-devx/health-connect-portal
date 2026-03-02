import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { usePrescriptions, useCreatePrescription } from "@/hooks/use-prescriptions";
import { usePatients, useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Plus } from "lucide-react";
import { format } from "date-fns";

export default function PrescriptionsPage() {
  const { data: profile } = useProfile();
  const { data: prescriptions, isLoading } = usePrescriptions();
  const { data: patients } = usePatients();
  const createMutation = useCreatePrescription();
  
  const [isOpen, setIsOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  const isDoctor = profile?.role === "doctor";

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !medication || !dosage || !instructions) return;
    
    createMutation.mutate(
      { doctorId: profile!.userId, patientId, medication, dosage, instructions },
      { onSuccess: () => {
          setIsOpen(false);
          setMedication("");
          setDosage("");
          setInstructions("");
        } 
      }
    );
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Prescriptions" 
        description="Active and past medication records."
        action={isDoctor && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 rounded-xl px-6">
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
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Choose a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.user.id} value={p.user.id}>
                          {p.user.firstName} {p.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Medication Name</Label>
                  <Input value={medication} onChange={e => setMedication(e.target.value)} required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg twice daily" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} required className="min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full h-12 mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Issuing..." : "Issue Prescription"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prescriptions?.length ? prescriptions.map((rx) => (
          <Card key={rx.id} className="relative overflow-hidden border-t-4 border-t-primary">
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-xl font-display text-slate-900">{rx.medication}</h4>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-primary font-medium mt-1">{rx.dosage}</p>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm text-slate-700">
              <p className="font-bold mb-1 text-slate-900">Instructions:</p>
              {rx.instructions}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-100">
              <span>{isDoctor ? `For: ${rx.patient.firstName} ${rx.patient.lastName}` : `By: Dr. ${rx.doctor.firstName} ${rx.doctor.lastName}`}</span>
              <span>{format(new Date(rx.issuedAt), "MMM d, yyyy")}</span>
            </div>
          </Card>
        )) : (
          <div className="col-span-full">
            <EmptyState icon={Pill} title="No prescriptions" description="There are no active prescriptions on record." />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
