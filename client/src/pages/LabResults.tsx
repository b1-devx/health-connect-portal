import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader, Card, EmptyState, LoadingScreen } from "@/components/ui-elements";
import { useLabResults, useCreateLabResult } from "@/hooks/use-lab-results";
import { useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, FilePlus, Download, FlaskConical, FileText, FileImage, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

async function readLabFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error("File too large. Maximum size is 15 MB."));
      return;
    }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxPx = 1600;
          const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.88));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

function FileChip({ name, type, onRemove }: { name: string; type: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm font-medium">
      {type.startsWith("image/") ? <FileImage className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
      <span className="truncate max-w-[200px]">{name}</span>
      <button type="button" onClick={onRemove} className="ml-1 hover:text-destructive transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function LabResultsPage() {
  const { data: profile } = useProfile();
  const { data: results, isLoading } = useLabResults();
  const createMutation = useCreateLabResult();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [resultData, setResultData] = useState("");
  const [file, setFile] = useState<{ data: string; name: string; type: string } | null>(null);

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await readLabFile(f);
      setFile({ data, name: f.name, type: f.type });
    } catch (err: any) {
      toast({ title: "File Error", description: err.message, variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate(
      {
        patientId: profile!.userId,
        title: title.trim(),
        resultData: resultData.trim() || undefined,
        fileData: file?.data,
        fileName: file?.name,
        fileUrl: undefined,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setTitle("");
          setResultData("");
          setFile(null);
        }
      }
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
              <Button
                data-testid="button-upload-result"
                className="shadow-lg shadow-primary/20 rounded-xl px-6 bg-gradient-to-r from-primary to-teal-500"
              >
                <FilePlus className="w-4 h-4 mr-2" /> Upload Result
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Add Lab Result</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Test Title <span className="text-destructive">*</span></Label>
                  <Input
                    data-testid="input-lab-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Complete Blood Count"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Result Notes <span className="text-slate-400 font-normal text-xs">(Optional)</span></Label>
                  <Textarea
                    data-testid="input-lab-notes"
                    value={resultData}
                    onChange={e => setResultData(e.target.value)}
                    placeholder="Key findings, values, or summary..."
                    className="min-h-[90px]"
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Attach File <span className="text-slate-400 font-normal text-xs">(PDF or Image — max 15 MB)</span></Label>
                  {file ? (
                    <FileChip name={file.name} type={file.type} onRemove={() => setFile(null)} />
                  ) : (
                    <button
                      type="button"
                      data-testid="button-pick-lab-file"
                      onClick={() => fileRef.current?.click()}
                      className="w-full h-24 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all flex flex-col items-center justify-center gap-2 text-primary"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-sm font-medium">Click to upload PDF, Word, or image</span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    className="hidden"
                    data-testid="input-lab-file"
                    onChange={handleFileChange}
                  />
                </div>

                <Button
                  data-testid="button-save-lab-result"
                  type="submit"
                  className="w-full h-12"
                  disabled={createMutation.isPending || !title.trim()}
                >
                  {createMutation.isPending ? "Saving..." : "Save Result"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        {results?.length ? results.map((res: any) => (
          <Card key={res.id} className="group" data-testid={`card-lab-result-${res.id}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg text-slate-900 leading-tight">{res.title}</h4>
                <p className="text-sm text-slate-500 mb-3">{format(new Date(res.date), "MMMM d, yyyy")}</p>

                {res.resultData && (
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100 mb-4 whitespace-pre-wrap">
                    {res.resultData}
                  </div>
                )}

                {/* Uploaded file */}
                {res.fileData && res.fileName && (
                  res.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) || res.fileData?.startsWith("data:image") ? (
                    <div className="mt-2 space-y-2">
                      <img
                        src={res.fileData}
                        alt={res.fileName}
                        className="max-h-48 rounded-xl border border-slate-200 shadow-sm object-contain bg-slate-50"
                      />
                      <a
                        href={res.fileData}
                        download={res.fileName}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download {res.fileName}
                      </a>
                    </div>
                  ) : (
                    <a
                      href={res.fileData}
                      download={res.fileName}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      {res.fileName}
                      <Download className="w-3.5 h-3.5 ml-auto" />
                    </a>
                  )
                )}

                {/* Legacy URL-only files */}
                {res.fileUrl && !res.fileData && (
                  <Button variant="outline" size="sm" asChild className="rounded-lg text-primary border-primary/20 hover:bg-primary/5 mt-2">
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
