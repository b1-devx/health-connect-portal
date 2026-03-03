import { useState } from "react";
import { Activity, Shield, HeartPulse, Clock, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "signin" | "signup";

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const openAuth = (m: AuthMode) => { setMode(m); setAuthOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast({ title: "Not configured", description: "Supabase credentials are not set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error("Please enter your first and last name.");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { firstName: firstName.trim(), lastName: lastName.trim() } },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "You can now sign in with your new account." });
        setMode("signin");
        setPassword("");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      toast({ title: "Authentication Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-8 h-8" />
            <span className="font-display font-bold text-2xl text-slate-900">WellA <span className="text-primary">app</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => openAuth("signin")} className="font-semibold">Sign In</Button>
            <Button onClick={() => openAuth("signup")} size="lg" className="rounded-full shadow-lg shadow-primary/20 font-semibold px-8">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next-generation Healthcare Portal
            </div>
            <h1 className="text-5xl lg:text-7xl font-display font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Your health, <br/>
              <span className="text-gradient">reimagined.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 mb-10 max-w-lg leading-relaxed">
              Connect with top medical professionals, manage your prescriptions, and track your lab results — all in one secure, beautiful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => openAuth("signup")} className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all">
                Get Started Today
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg border-slate-200 hover:bg-slate-50">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>

          <div className="relative animate-slide-up delay-200 hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-teal-400/20 rounded-[3rem] transform rotate-3 scale-105 blur-2xl"></div>
            <img
              src="/doctor-hero.jpg"
              alt="Medical Professional"
              className="relative z-10 w-full h-auto rounded-[3rem] shadow-2xl object-cover aspect-[4/3] border-4 border-white object-top"
            />
            <div className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">HIPAA Compliant</p>
                <p className="font-bold text-slate-900">100% Secure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-display font-bold text-slate-900 mb-4">Everything you need</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Seamlessly bridging the gap between healthcare providers and patients with powerful digital tools.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Virtual Consultations", desc: "Book appointments and connect via secure Google Meet integration.", icon: Clock },
              { title: "Lab Results Storage", desc: "Keep all your medical records and lab results safely in one place.", icon: Activity },
              { title: "Digital Prescriptions", desc: "Receive and manage your prescriptions digitally without paper.", icon: HeartPulse },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-lg text-slate-900">WellA <span className="text-primary">app</span></span>
            </div>
            <DialogTitle className="text-2xl font-display">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </DialogTitle>
          </DialogHeader>

          {/* Toggle tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-2">
            <button onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "signin" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}>
              Sign In
            </button>
            <button onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "signup" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}>
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input data-testid="input-first-name" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-11" placeholder="Maria" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input data-testid="input-last-name" value={lastName} onChange={e => setLastName(e.target.value)} className="h-11" placeholder="Santos" required />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input data-testid="input-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11" placeholder="you@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input data-testid="input-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="h-11 pr-10" placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "signup" && <p className="text-xs text-slate-400">Minimum 6 characters</p>}
            </div>
            <Button data-testid="button-auth-submit" type="submit" disabled={loading} className="w-full h-12 rounded-xl">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-2">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-semibold hover:underline">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
