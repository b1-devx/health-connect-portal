import { useState } from "react";
import { useCreateProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, UserRound } from "lucide-react";
import { LoadingScreen } from "@/components/ui-elements";

export default function Onboarding() {
  const { user } = useAuth();
  const createProfile = useCreateProfile();
  
  const [role, setRole] = useState<"patient" | "doctor" | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  if (!user) return <LoadingScreen />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    createProfile.mutate({
      userId: user.id,
      role,
      specialty: role === "doctor" ? specialty : undefined,
      medicalHistory: role === "patient" ? medicalHistory : undefined,
      dateOfBirth: role === "patient" && dateOfBirth ? new Date(dateOfBirth) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 medical-gradient">
      <div className="max-w-xl w-full bg-white rounded-[2rem] shadow-2xl p-8 sm:p-12 border border-slate-100 animate-slide-up">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-slate-900">Welcome to WellA app</h1>
          <p className="text-slate-500 mt-2">Let's get your profile set up, {user.firstName}.</p>
        </div>

        {!role ? (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-medium text-slate-700 text-center mb-4">I am joining as a...</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setRole("patient")}
                className="p-8 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-4 group"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <UserRound className="w-8 h-8 text-slate-600 group-hover:text-primary" />
                </div>
                <span className="font-bold text-lg text-slate-800">Patient</span>
              </button>
              
              <button
                onClick={() => setRole("doctor")}
                className="p-8 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-4 group"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Stethoscope className="w-8 h-8 text-slate-600 group-hover:text-primary" />
                </div>
                <span className="font-bold text-lg text-slate-800">Doctor</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <button type="button" onClick={() => setRole(null)} className="text-sm text-primary hover:underline">
                ← Back
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-sm font-medium capitalize text-slate-600">{role} Setup</span>
            </div>

            {role === "doctor" && (
              <div className="space-y-2">
                <Label htmlFor="specialty">Medical Specialty</Label>
                <Input 
                  id="specialty" 
                  placeholder="e.g., Cardiology, General Practice" 
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            )}

            {role === "patient" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input 
                    id="dob" 
                    type="date" 
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history">Medical History (Optional)</Label>
                  <Textarea 
                    id="history" 
                    placeholder="Any known allergies, chronic conditions, etc." 
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    className="min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
              disabled={createProfile.isPending}
            >
              {createProfile.isPending ? "Creating..." : "Complete Setup"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
