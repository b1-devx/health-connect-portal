import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { usePatientRequests, useCreatePatientRequest, useUpdatePatientRequest, useAnalyzeRequest } from "@/hooks/use-requests";
import { useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, CheckCircle2, Send, XCircle, Sparkles, FileText, Link, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function RequestsPage() {
  const { data: profile } = useProfile();
  const { data: requests, isLoading } = usePatientRequests();
  const createMutation = useCreatePatientRequest();
  const updateMutation = useUpdatePatientRequest();
  const analyzeMutation = useAnalyzeRequest();

  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [labFileUrl, setLabFileUrl] = useState("");
  const [labResultText, setLabResultText] = useState("");
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  const isDoctor = profile?.role === "doctor";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !description) return;

    createMutation.mutate(
      {
        patientId: profile!.userId,
        type,
        description,
        labFileUrl: labFileUrl || undefined,
        labResultText: labResultText || undefined,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setType("");
          setDescription("");
          setLabFileUrl("");
          setLabResultText("");
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
              <Button data-testid="button-new-request" className="shadow-lg shadow-primary/20 rounded-xl px-6">
                <Send className="w-4 h-4 mr-2" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Submit Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select onValueChange={setType} required>
                    <SelectTrigger data-testid="select-request-type" className="w-full h-12">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkup">General Checkup / Meeting</SelectItem>
                      <SelectItem value="prescription">Prescription Refill</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Details</Label>
                  <Textarea
                    data-testid="input-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Please describe what you need, your symptoms, or concerns..."
                    required
                    className="min-h-[100px]"
                  />
                </div>

                {/* Lab Results Attachment Section */}
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <FileText className="w-4 h-4" />
                    Attach Lab Results (Optional)
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Lab Result Notes / Values</Label>
                    <Textarea
                      data-testid="input-lab-result-text"
                      value={labResultText}
                      onChange={e => setLabResultText(e.target.value)}
                      placeholder="Paste key values or findings (e.g., CBC results, glucose levels...)"
                      className="min-h-[80px] text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5" /> Lab File URL
                    </Label>
                    <Input
                      data-testid="input-lab-file-url"
                      value={labFileUrl}
                      onChange={e => setLabFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or any accessible link"
                      className="h-10 text-sm bg-white"
                    />
                  </div>
                </div>

                <Button data-testid="button-submit-request" type="submit" className="w-full h-12 mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Sending..." : "Submit Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {requests?.length ? requests.map((req) => (
          <Card key={req.id} data-testid={`card-request-${req.id}`} className="flex flex-col gap-0 p-0 overflow-hidden">
            {/* Card Header */}
            <div className="p-5 pb-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${req.status === 'pending' ? 'bg-amber-100 text-amber-600' : req.status === 'fulfilled' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {req.status === 'pending' ? <Bell className="w-4 h-4" /> : req.status === 'fulfilled' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
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

              <div className="bg-slate-50 p-3 rounded-xl text-slate-700 border border-slate-100 text-sm mb-3">
                <p className="whitespace-pre-wrap">{req.description}</p>
              </div>

              {/* Lab Attachments */}
              {(req.labResultText || req.labFileUrl) && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Lab Results Attached
                  </p>
                  {req.labResultText && (
                    <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-3">{req.labResultText}</p>
                  )}
                  {req.labFileUrl && (
                    <a
                      href={req.labFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline flex items-center gap-1 hover:text-primary/80"
                    >
                      <Link className="w-3 h-3" /> View Lab File
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* AI Analysis Section */}
            {req.aiAnalysis && (
              <div className="mx-5 mb-4 rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                  onClick={() => setExpandedAnalysis(expandedAnalysis === req.id ? null : req.id)}
                  data-testid={`button-toggle-analysis-${req.id}`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> AI Analysis Result
                  </span>
                  {expandedAnalysis === req.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedAnalysis === req.id && (
                  <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-wrap border-t border-violet-200 pt-3">
                    {req.aiAnalysis}
                  </div>
                )}
              </div>
            )}

            {/* Doctor Actions */}
            {isDoctor && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <img
                    src={`https://ui-avatars.com/api/?name=${req.patient.firstName || 'P'}+${req.patient.lastName || ''}&background=F1F5F9&color=475569`}
                    alt="Patient"
                    className="w-6 h-6 rounded-full"
                  />
                  {req.patient.firstName || req.patient.email?.split('@')[0]} {req.patient.lastName}
                </div>
                <div className="flex gap-2">
                  {(req.labResultText || req.labFileUrl) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-violet-600 border-violet-200 hover:bg-violet-50 gap-1.5"
                      onClick={() => analyzeMutation.mutate(req.id)}
                      disabled={analyzeMutation.isPending && analyzeMutation.variables === req.id}
                      data-testid={`button-analyze-${req.id}`}
                    >
                      {analyzeMutation.isPending && analyzeMutation.variables === req.id
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
                        : <><Sparkles className="w-3.5 h-3.5" /> {req.aiAnalysis ? 'Re-analyze' : 'Analyze with AI'}</>
                      }
                    </Button>
                  )}
                  {req.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateMutation.mutate({ id: req.id, status: 'fulfilled' })} data-testid={`button-fulfill-${req.id}`}>
                        Fulfill
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateMutation.mutate({ id: req.id, status: 'rejected' })} data-testid={`button-reject-${req.id}`}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
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
