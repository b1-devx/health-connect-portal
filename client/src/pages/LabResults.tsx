import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { useLabResults, useCreateLabResult } from "@/hooks/use-lab-results";
import { useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, FilePlus, Download, FlaskConical } from "lucide-react";
import { format } from "date-fns";

export default function LabResultsPage() {
  const { data: profile } = useProfile();
  const { data: results, isLoading } = useLabResults();
  const createMutation = useCreateLabResult();
  
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [resultData, setResultData] = useState("");
  const [fileUrl, setFileUrl] = useState(""); // Mock for actual upload

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    createMutation.mutate(
      { 
        patientId: profile!.userId, // Simplification: assume patient uploading own, or doctor needs a patient selector (omitted for MVP)
        title, 
        resultData,
        fileUrl 
      },
      { onSuccess: () => setIsOpen(false) }
    );
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Lab Results" 
        description="View and manage your medical test results."
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 rounded-xl px-6 bg-gradient-to-r from-primary to-teal-500">
                <FilePlus className="w-4 h-4 mr-2" /> Upload Result
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Add Lab Result</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Test Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Complete Blood Count" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Result Data / Notes</Label>
                  <Textarea value={resultData} onChange={e => setResultData(e.target.value)} placeholder="Key findings..." className="min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label>Document URL (Optional)</Label>
                  <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." className="h-12" />
                </div>
                <Button type="submit" className="w-full h-12 mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Result"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        {results?.length ? results.map((res) => (
          <Card key={res.id} className="group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg text-slate-900 leading-tight">{res.title}</h4>
                <p className="text-sm text-slate-500 mb-3">{format(new Date(res.date), "MMMM d, yyyy")}</p>
                
                {res.resultData && (
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100 mb-4">
                    {res.resultData}
                  </div>
                )}
                
                {res.fileUrl && (
                  <Button variant="outline" size="sm" asChild className="rounded-lg text-primary border-primary/20 hover:bg-primary/5">
                    <a href={res.fileUrl} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4 mr-2" /> View Document
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )) : (
          <div className="col-span-full">
            <EmptyState icon={Activity} title="No lab results found" description="Upload your test results to keep them safely stored here." />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
