import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { usePatientRequests, useCreatePatientRequest, useUpdatePatientRequest } from "@/hooks/use-requests";
import { useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, CheckCircle2, Send, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function RequestsPage() {
  const { data: profile } = useProfile();
  const { data: requests, isLoading } = usePatientRequests();
  const createMutation = useCreatePatientRequest();
  const updateMutation = useUpdatePatientRequest();
  
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  const isDoctor = profile?.role === "doctor";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !description) return;
    
    createMutation.mutate(
      { patientId: profile!.userId, type, description },
      { onSuccess: () => {
          setIsOpen(false);
          setType("");
          setDescription("");
        } 
      }
    );
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Requests" 
        description={isDoctor ? "Manage incoming patient requests." : "Send direct requests to your healthcare team."}
        action={!isDoctor && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 rounded-xl px-6">
                <Send className="w-4 h-4 mr-2" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Submit Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select onValueChange={setType} required>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkup">General Checkup</SelectItem>
                      <SelectItem value="prescription">Prescription Refill</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Details</Label>
                  <Textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Please describe what you need..." 
                    required 
                    className="min-h-[120px]" 
                  />
                </div>
                <Button type="submit" className="w-full h-12 mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Sending..." : "Submit Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {requests?.length ? requests.map((req) => (
          <Card key={req.id} className="flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${req.status === 'pending' ? 'bg-amber-100 text-amber-600' : req.status === 'fulfilled' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {req.status === 'pending' ? <Bell className="w-5 h-5" /> : req.status === 'fulfilled' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 capitalize">{req.type} Request</h4>
                  <p className="text-xs text-slate-500">{format(new Date(req.createdAt), "PPp")}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize border
                ${req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                  req.status === 'fulfilled' ? 'bg-green-50 text-green-700 border-green-200' : 
                  'bg-red-50 text-red-700 border-red-200'}`}>
                {req.status}
              </span>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl text-slate-700 flex-1 border border-slate-100 text-sm">
              <p className="whitespace-pre-wrap">{req.description}</p>
            </div>

            {isDoctor && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${req.patient.firstName}+${req.patient.lastName}&background=F1F5F9&color=475569`} 
                    alt="Patient" 
                    className="w-6 h-6 rounded-full"
                  />
                  {req.patient.firstName} {req.patient.lastName}
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateMutation.mutate({ id: req.id, status: 'fulfilled' })}>
                      Fulfill
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateMutation.mutate({ id: req.id, status: 'rejected' })}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        )) : (
          <div className="col-span-full">
            <EmptyState icon={Bell} title="No requests" description="There are no requests to show." />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
