import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui-elements";
import { useProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/ui-elements";
import {
  Camera, User, Phone, MapPin, Briefcase, BadgeCheck, Building2,
  HeartPulse, ShieldAlert, PenLine, Save, ImagePlus
} from "lucide-react";

async function compressImage(file: File, maxPx = 600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale; canvas.height = img.height * scale;
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

async function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm border-b border-slate-100 pb-3 mb-4">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      {title}
    </div>
  );
}

function ImageUploadBox({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {value ? (
        <div className="relative w-fit">
          <img src={value} alt={label} className="max-h-24 max-w-[240px] rounded-xl border border-slate-200 object-contain bg-slate-50 shadow-sm" />
          <button type="button" onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center hover:bg-destructive/80">✕</button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full h-20 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-1.5 text-primary/70">
          <ImagePlus className="w-5 h-5" />
          <span className="text-xs font-medium">Click to upload</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) { const data = await compressImage(f); onChange(data); }
          e.target.value = "";
        }} />
    </div>
  );
}

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const photoRef = useRef<HTMLInputElement>(null);

  const isDoctor = profile?.role === "doctor";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  // Doctor fields
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicLogoData, setClinicLogoData] = useState("");
  const [signatureData, setSignatureData] = useState("");

  // Patient fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  useEffect(() => {
    if (!profile) return;
    const p = profile as any;
    setFirstName(p.firstName || "");
    setLastName(p.lastName || "");
    setPhone(p.phone || "");
    setAddress(p.address || "");
    setProfilePhotoUrl(p.profilePhotoUrl || "");
    if (isDoctor) {
      setSpecialty(p.specialty || "");
      setLicenseNumber(p.licenseNumber || "");
      setClinicAddress(p.clinicAddress || "");
      setClinicPhone(p.clinicPhone || "");
      setClinicLogoData(p.clinicLogoData || "");
      setSignatureData(p.signatureData || "");
    } else {
      setDateOfBirth(p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split("T")[0] : "");
      setMedicalHistory(p.medicalHistory || "");
      setEmergencyContactName(p.emergencyContactName || "");
      setEmergencyContactRelationship(p.emergencyContactRelationship || "");
      setEmergencyContactPhone(p.emergencyContactPhone || "");
    }
  }, [profile, isDoctor]);

  if (isLoading) return <AppLayout><LoadingScreen /></AppLayout>;
  if (!profile) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const base: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      profilePhotoUrl: profilePhotoUrl || undefined,
    };
    if (isDoctor) {
      Object.assign(base, {
        specialty: specialty.trim(),
        licenseNumber: licenseNumber.trim(),
        clinicAddress: clinicAddress.trim() || undefined,
        clinicPhone: clinicPhone.trim() || undefined,
        clinicLogoData: clinicLogoData || undefined,
        signatureData: signatureData || undefined,
      });
    } else {
      Object.assign(base, {
        dateOfBirth: dateOfBirth ? dateOfBirth : undefined,
        medicalHistory: medicalHistory.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactRelationship: emergencyContactRelationship.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      });
    }
    updateProfile.mutate(base);
  };

  return (
    <AppLayout>
      <PageHeader title="Profile Settings" description="Update your personal and professional information." />

      <form onSubmit={handleSave} className="max-w-2xl space-y-8">

        {/* Profile Photo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={Camera} title="Profile Photo" />
          <div className="flex items-center gap-6">
            <div className="relative">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
              )}
              <button type="button" onClick={() => photoRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-slate-800">{firstName} {lastName}</p>
              <p className="text-sm text-slate-500 capitalize">{profile.role}</p>
              <button type="button" data-testid="button-change-photo" onClick={() => photoRef.current?.click()}
                className="text-xs text-primary hover:underline mt-1">Change photo</button>
            </div>
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) { const data = await compressImage(f, 400); setProfilePhotoUrl(data); }
              e.target.value = "";
            }} />
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={User} title="Personal Information" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label>First Name <span className="text-destructive">*</span></Label>
              <Input data-testid="input-first-name" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-11" required />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name <span className="text-destructive">*</span></Label>
              <Input data-testid="input-last-name" value={lastName} onChange={e => setLastName(e.target.value)} className="h-11" required />
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</Label>
            <Input data-testid="input-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</Label>
            <Input data-testid="input-address" value={address} onChange={e => setAddress(e.target.value)} className="h-11" />
          </div>
        </div>

        {/* Doctor: Professional */}
        {isDoctor && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={Briefcase} title="Professional Details" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Specialty</Label>
                  <Input data-testid="input-specialty" value={specialty} onChange={e => setSpecialty(e.target.value)} className="h-11" placeholder="e.g. Cardiology" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> PRC / License No.</Label>
                  <Input data-testid="input-license" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="h-11" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={Building2} title="Clinic Information" />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Clinic Address</Label>
                  <Input data-testid="input-clinic-address" value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} className="h-11" placeholder="Clinic full address" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Clinic Phone</Label>
                  <Input data-testid="input-clinic-phone" value={clinicPhone} onChange={e => setClinicPhone(e.target.value)} className="h-11" placeholder="Clinic telephone / mobile" />
                </div>
                <ImageUploadBox
                  label="Clinic Logo"
                  value={clinicLogoData}
                  onChange={setClinicLogoData}
                  hint="Shown on your prescription letterhead. PNG or JPEG recommended."
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={PenLine} title="Digital Signature" />
              <ImageUploadBox
                label="Signature Image"
                value={signatureData}
                onChange={setSignatureData}
                hint="Upload a photo or scan of your handwritten signature. Appears at the bottom of prescriptions."
              />
            </div>
          </>
        )}

        {/* Patient: Medical & Emergency */}
        {!isDoctor && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={HeartPulse} title="Medical Information" />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input data-testid="input-dob" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="h-11"
                    max={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-1.5">
                  <Label>Medical History</Label>
                  <Textarea data-testid="input-medical-history" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)}
                    className="min-h-[100px]" placeholder="Known allergies, conditions, medications..." />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={ShieldAlert} title="Emergency Contact" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input data-testid="input-emergency-name" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Relationship</Label>
                    <Input data-testid="input-emergency-relationship" value={emergencyContactRelationship} onChange={e => setEmergencyContactRelationship(e.target.value)} className="h-11" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input data-testid="input-emergency-phone" type="tel" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} className="h-11" />
                </div>
              </div>
            </div>
          </>
        )}

        <Button
          type="submit"
          data-testid="button-save-settings"
          disabled={updateProfile.isPending}
          className="w-full h-13 text-base rounded-2xl shadow-lg shadow-primary/20 gap-2"
        >
          <Save className="w-5 h-5" />
          {updateProfile.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </AppLayout>
  );
}
