import { useState, useRef } from "react";
import { useCreateProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, UserRound, Camera, ArrowLeft, ArrowRight, Check, User, Phone, MapPin, Briefcase, HeartPulse, ShieldAlert } from "lucide-react";
import { LoadingScreen } from "@/components/ui-elements";

type Role = "patient" | "doctor";

function compressImage(file: File, maxPx = 400, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const STEPS_DOCTOR = ["Role", "Personal Info", "Professional", "Review"];
const STEPS_PATIENT = ["Role", "Personal Info", "Medical", "Emergency Contact", "Review"];

export default function Onboarding() {
  const { user } = useAuth();
  const createProfile = useCreateProfile();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState<Role | null>(null);
  const [step, setStep] = useState(0);

  // Step 1 – Personal Info
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Step 2 – Doctor
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Step 2 – Patient
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  // Step 3 – Patient Emergency Contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  if (!user) return <LoadingScreen />;

  const steps = role === "doctor" ? STEPS_DOCTOR : STEPS_PATIENT;
  const totalSteps = steps.length;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setProfilePhotoUrl(compressed);
      setPhotoPreview(compressed);
    } catch {
      // silently ignore
    }
  };

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setStep(1);
  };

  const canNext = () => {
    if (step === 1) return firstName.trim() && lastName.trim() && phone.trim() && profilePhotoUrl;
    if (step === 2 && role === "doctor") return specialty.trim() && licenseNumber.trim();
    if (step === 2 && role === "patient") return dateOfBirth.trim();
    if (step === 3 && role === "patient") return emergencyName.trim() && emergencyRelationship.trim() && emergencyPhone.trim();
    return true;
  };

  const handleNext = () => {
    if (!canNext()) return;
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step === 1) { setRole(null); setStep(0); }
    else setStep(s => s - 1);
  };

  const handleSubmit = () => {
    if (!role) return;
    createProfile.mutate({
      userId: user.id,
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      profilePhotoUrl: profilePhotoUrl || undefined,
      specialty: role === "doctor" ? specialty.trim() : undefined,
      licenseNumber: role === "doctor" ? licenseNumber.trim() : undefined,
      dateOfBirth: role === "patient" && dateOfBirth ? new Date(dateOfBirth) : undefined,
      medicalHistory: role === "patient" ? medicalHistory.trim() || undefined : undefined,
      emergencyContactName: role === "patient" ? emergencyName.trim() : undefined,
      emergencyContactRelationship: role === "patient" ? emergencyRelationship.trim() : undefined,
      emergencyContactPhone: role === "patient" ? emergencyPhone.trim() : undefined,
    });
  };

  const reviewName = `${firstName} ${lastName}`.trim();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 medical-gradient">
      <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-teal-500 px-8 pt-8 pb-6 text-white">
          <h1 className="text-2xl font-display font-bold">Welcome to WellA app</h1>
          <p className="text-white/80 text-sm mt-1">
            {step === 0 ? "Tell us who you are to get started." : `Step ${step} of ${totalSteps - 1} — ${steps[step]}`}
          </p>

          {/* Progress bar */}
          {step > 0 && (
            <div className="mt-4 flex gap-1.5">
              {steps.slice(1).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < step ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="p-8">
          {/* Step 0: Role Selection */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold text-slate-700 text-center">I am joining as a...</h2>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  data-testid="role-patient"
                  onClick={() => handleRoleSelect("patient")}
                  className="p-8 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-4 group"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <UserRound className="w-8 h-8 text-slate-600 group-hover:text-primary" />
                  </div>
                  <span className="font-bold text-lg text-slate-800">Patient</span>
                </button>
                <button
                  data-testid="role-doctor"
                  onClick={() => handleRoleSelect("doctor")}
                  className="p-8 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-4 group"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Stethoscope className="w-8 h-8 text-slate-600 group-hover:text-primary" />
                  </div>
                  <span className="font-bold text-lg text-slate-800">Doctor</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
                <User className="w-4 h-4" /> Personal Information
              </div>

              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div
                  className="relative w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-lg cursor-pointer group overflow-hidden"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="button-upload-photo"
                  onClick={() => photoInputRef.current?.click()}
                  className="text-sm text-primary font-medium hover:underline flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  {photoPreview ? "Change Photo" : "Upload Profile Photo"}
                </button>
                {!photoPreview && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <span className="text-destructive">*</span> Profile photo is required
                  </p>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  data-testid="input-photo"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name <span className="text-destructive">*</span></Label>
                  <Input
                    data-testid="input-first-name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="h-11 bg-slate-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name <span className="text-destructive">*</span></Label>
                  <Input
                    data-testid="input-last-name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Santos"
                    className="h-11 bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                  className="h-11 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address <span className="text-slate-400 font-normal text-xs">(Optional)</span></Label>
                <Input
                  data-testid="input-address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="City, Province"
                  className="h-11 bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Step 2: Doctor — Professional Info */}
          {step === 2 && role === "doctor" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
                <Briefcase className="w-4 h-4" /> Professional Details
              </div>
              <div className="space-y-1.5">
                <Label>Medical Specialty <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-specialty"
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  placeholder="e.g., Cardiology, General Practice"
                  className="h-11 bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label>License / PRC Number <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-license"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="e.g., 0123456"
                  className="h-11 bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Step 2: Patient — Medical Info */}
          {step === 2 && role === "patient" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
                <HeartPulse className="w-4 h-4" /> Medical Information
              </div>
              <div className="space-y-1.5">
                <Label>Date of Birth <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="h-11 bg-slate-50"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Medical History <span className="text-slate-400 font-normal text-xs">(Optional)</span></Label>
                <Textarea
                  data-testid="input-medical-history"
                  value={medicalHistory}
                  onChange={e => setMedicalHistory(e.target.value)}
                  placeholder="Known allergies, chronic conditions, current medications..."
                  className="min-h-[110px] bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Step 3: Patient — Emergency Contact */}
          {step === 3 && role === "patient" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm font-medium">
                <ShieldAlert className="w-4 h-4" /> Emergency Contact
              </div>
              <p className="text-sm text-slate-500 bg-amber-50 border border-amber-100 rounded-xl p-3">
                In case of emergency, we will contact this person on your behalf.
              </p>
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-emergency-name"
                  value={emergencyName}
                  onChange={e => setEmergencyName(e.target.value)}
                  placeholder="e.g., Maria Santos"
                  className="h-11 bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Relationship <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-emergency-relationship"
                  value={emergencyRelationship}
                  onChange={e => setEmergencyRelationship(e.target.value)}
                  placeholder="e.g., Spouse, Parent, Sibling"
                  className="h-11 bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-emergency-phone"
                  type="tel"
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                  className="h-11 bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Review Step */}
          {((step === 3 && role === "doctor") || (step === 4 && role === "patient")) && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-semibold text-slate-700 text-center">Review Your Information</h3>
              <div className="flex flex-col items-center gap-2 py-2">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-primary/20 shadow" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-200">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <p className="font-bold text-lg text-slate-900">{reviewName}</p>
                <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full capitalize">{role}</span>
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden text-sm">
                <ReviewRow label="Phone" value={phone} />
                {address && <ReviewRow label="Address" value={address} />}
                {role === "doctor" && <ReviewRow label="Specialty" value={specialty} />}
                {role === "doctor" && <ReviewRow label="License No." value={licenseNumber} />}
                {role === "patient" && dateOfBirth && <ReviewRow label="Date of Birth" value={new Date(dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />}
                {role === "patient" && medicalHistory && <ReviewRow label="Medical History" value={medicalHistory} />}
                {role === "patient" && <ReviewRow label="Emergency Contact" value={`${emergencyName} (${emergencyRelationship})`} />}
                {role === "patient" && <ReviewRow label="Emergency Phone" value={emergencyPhone} />}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step > 0 && (
            <div className="flex gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2 px-5 rounded-xl h-12"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {((step < totalSteps - 1)) ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext()}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl"
                  data-testid="button-next"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createProfile.isPending}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl shadow-lg shadow-primary/20"
                  data-testid="button-complete-setup"
                >
                  <Check className="w-4 h-4" />
                  {createProfile.isPending ? "Setting up..." : "Complete Setup"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3 bg-white">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[55%]">{value}</span>
    </div>
  );
}
